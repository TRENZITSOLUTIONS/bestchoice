from django.core.management.base import BaseCommand

from loyalty.utils import expire_lapsed_points


class Command(BaseCommand):
    help = 'Expire loyalty point batches whose 12-month validity window has passed. Run daily via cron.'

    def handle(self, *args, **options):
        expired_count = expire_lapsed_points()
        self.stdout.write(self.style.SUCCESS(f'Expired {expired_count} loyalty point batch(es).'))
