import csv
import os
from django.core.management.base import BaseCommand, CommandError
from delivery.models import DeliveryPincode


# Default mapping for cities known to support same-day delivery in Chennai
SAME_DAY_CITIES = {'chennai'}

# Default store pickup locations
STORE_PICKUP_CITIES = {'chennai', 'coimbatore', 'madurai'}

# Default: which cities have store pickup
DEFAULT_PICKUP = {'chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'salem',
                   'erode', 'tirunelveli', 'vellore', 'thanjavur', 'nagercoil',
                   'thoothukudi', 'hosur'}


class Command(BaseCommand):
    help = 'Import Tamilnadu pincodes from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', nargs='?', type=str,
                            help='Path to CSV file with pincode data')
        parser.add_argument('--state', type=str, default='Tamil Nadu',
                            help='Filter by state name (default: Tamil Nadu)')
        parser.add_argument('--clear', action='store_true',
                            help='Clear existing data before import')
        parser.add_argument('--sample', action='store_true',
                            help='Generate a sample CSV template')

    def handle(self, *args, **options):
        if options['sample']:
            self._generate_sample()
            return

        csv_path = options['csv_file']
        if not csv_path:
            # Try default locations
            for path in ['pincodes.csv', 'tamilnadu_pincodes.csv',
                         os.path.join('data', 'pincodes.csv')]:
                if os.path.exists(path):
                    csv_path = path
                    break

        if not csv_path:
            raise CommandError(
                'No CSV file provided. Usage:\n'
                '  python manage.py import_pincodes path/to/pincodes.csv\n'
                '  python manage.py import_pincodes --sample  (to generate template)'
            )

        if options['clear']:
            deleted, _ = DeliveryPincode.objects.all().delete()
            self.stdout.write(f'Cleared {deleted} existing pincodes')

        state_filter = options['state'].lower()
        created = 0
        skipped = 0
        errors = 0

        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                raise CommandError('Empty CSV or missing header row')

            # Auto-detect column mappings
            headers = [h.lower().strip() for h in reader.fieldnames]
            col_map = self._detect_columns(headers)

            if not col_map:
                raise CommandError(
                    'Could not detect columns. Expected: pincode, office, district, state\n'
                    f'Found headers: {headers}\n'
                    'Run --sample to see expected format'
                )

            for row_num, row in enumerate(reader, start=2):
                try:
                    # Normalize keys
                    clean = {k.lower().strip(): v.strip() for k, v in row.items()}

                    state = clean.get(col_map['state'], '').lower()
                    if state_filter not in state:
                        skipped += 1
                        continue

                    pincode = clean.get(col_map['pincode'], '').replace("'", "").strip()
                    if not pincode or not pincode.isdigit() or len(pincode) != 6:
                        errors += 1
                        continue

                    district = clean.get(col_map['district'], '')
                    office = clean.get(col_map.get('office', ''), '')
                    city = district or office

                    city_lower = city.lower()

                    if city_lower in SAME_DAY_CITIES:
                        delivery_type = 'same_day'
                        days = 'Today'
                    else:
                        delivery_type = 'standard'
                        days = '2-3 days'

                    DeliveryPincode.objects.update_or_create(
                        pincode=pincode,
                        defaults={
                            'city': city,
                            'state': 'Tamilnadu',
                            'delivery_type': delivery_type,
                            'estimated_days_text': days,
                            'store_pickup_available': city_lower in DEFAULT_PICKUP,
                            'cod_available': True,
                            'is_active': True,
                        }
                    )
                    created += 1

                except Exception as e:
                    errors += 1
                    if errors <= 5:
                        self.stdout.write(self.style.WARNING(
                            f'Row {row_num}: {e}'
                        ))

        total = DeliveryPincode.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'Imported: {created} | Skipped (other states): {skipped} | Errors: {errors} | Total in DB: {total}'
        ))

    def _detect_columns(self, headers):
        """Auto-detect which column is pincode, office, district, state"""
        mapping = {}
        for h in headers:
            hl = h.lower()
            if hl in ('pincode', 'pin', 'pincode'):
                mapping['pincode'] = h
            elif 'officename' in hl or hl == 'office' or hl == 'name':
                mapping['office'] = h
            elif hl in ('district', 'dist', 'districtname'):
                mapping['district'] = h
            elif hl in ('state', 'st', 'statename'):
                mapping['state'] = h

        if 'pincode' in mapping and 'state' in mapping:
            return mapping
        return None

    def _generate_sample(self):
        """Generate a sample CSV template"""
        sample_path = 'sample_pincodes.csv'
        with open(sample_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Pincode', 'OfficeName', 'District', 'StateName'])
            writer.writerow(['600001', 'Anna Nagar HO', 'Chennai', 'Tamil Nadu'])
            writer.writerow(['600002', 'Thousand Lights', 'Chennai', 'Tamil Nadu'])
            writer.writerow(['641001', 'Coimbatore HO', 'Coimbatore', 'Tamil Nadu'])
            writer.writerow(['625001', 'Madurai HO', 'Madurai', 'Tamil Nadu'])

        self.stdout.write(self.style.SUCCESS(
            f'Sample CSV created at {sample_path}\n'
            f'Download full data from: https://data.gov.in/resource/all-india-pincode-directory\n'
            f'Then run: python manage.py import_pincodes path/to/downloaded.csv'
        ))
