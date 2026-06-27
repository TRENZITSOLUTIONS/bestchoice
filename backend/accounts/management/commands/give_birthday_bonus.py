from datetime import date
from django.core.management.base import BaseCommand
from accounts.models import User
from loyalty.models import LoyaltyTransaction


BIRTHDAY_BONUS_POINTS = 100


class Command(BaseCommand):
    help = 'Give birthday bonus points to users whose birthday is today'

    def handle(self, *args, **options):
        today = date.today()
        users = User.objects.filter(
            date_of_birth__month=today.month,
            date_of_birth__day=today.day,
            is_active=True,
        )
        given = 0
        for user in users:
            user.loyalty_points += BIRTHDAY_BONUS_POINTS
            user.save(update_fields=['loyalty_points'])
            LoyaltyTransaction.objects.create(
                user=user,
                points=BIRTHDAY_BONUS_POINTS,
                type='earned',
                description='Birthday bonus',
            )
            given += 1
        self.stdout.write(self.style.SUCCESS(f'Birthday bonus given to {given} user(s)'))
