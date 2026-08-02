from datetime import date
from django.core.management.base import BaseCommand
from accounts.models import User
from loyalty.models import LoyaltyConfig
from loyalty.utils import earn_points


class Command(BaseCommand):
    help = 'Give birthday bonus points to users whose birthday is today'

    def handle(self, *args, **options):
        today = date.today()
        users = User.objects.filter(
            date_of_birth__month=today.month,
            date_of_birth__day=today.day,
            is_active=True,
        )
        bonus_points = LoyaltyConfig.get_config().birthday_bonus_points
        given = 0
        for user in users:
            earn_points(user, bonus_points, description='Birthday bonus')
            given += 1
        self.stdout.write(self.style.SUCCESS(f'Birthday bonus given to {given} user(s)'))
