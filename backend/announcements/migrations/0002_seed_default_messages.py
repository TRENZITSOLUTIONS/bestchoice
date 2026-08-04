from django.db import migrations

# Matches what was previously hardcoded in the frontend ticker component, so
# turning this on doesn't change what customers see until staff edit it here.
DEFAULT_MESSAGES = [
    'Free delivery on orders above ₹500',
    'Store pickup at Spencer Plaza, Chennai',
    '7-day easy returns',
    'Earn Best Choice Rewards on every order',
    '2–4 business day delivery across Tamil Nadu',
]


def seed_messages(apps, schema_editor):
    AnnouncementMessage = apps.get_model('announcements', 'AnnouncementMessage')
    if AnnouncementMessage.objects.exists():
        return
    for i, text in enumerate(DEFAULT_MESSAGES):
        AnnouncementMessage.objects.create(text=text, sort_order=i)


def unseed_messages(apps, schema_editor):
    AnnouncementMessage = apps.get_model('announcements', 'AnnouncementMessage')
    AnnouncementMessage.objects.filter(text__in=DEFAULT_MESSAGES).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('announcements', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_messages, unseed_messages),
    ]
