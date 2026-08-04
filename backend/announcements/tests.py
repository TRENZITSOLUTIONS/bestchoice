from django.test import TestCase
from rest_framework.test import APIClient

from .models import AnnouncementMessage


class AnnouncementListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # The data migration seeds default messages, present in every test's
        # baseline (TestCase rolls back to post-migration state, not empty).
        AnnouncementMessage.objects.all().delete()

    def test_returns_only_active_messages_in_sort_order(self):
        AnnouncementMessage.objects.create(text='Third', sort_order=2)
        AnnouncementMessage.objects.create(text='First', sort_order=0)
        AnnouncementMessage.objects.create(text='Hidden', sort_order=1, is_active=False)

        res = self.client.get('/api/announcements/')
        self.assertEqual(res.status_code, 200)
        texts = [m['text'] for m in res.data['results']]
        self.assertEqual(texts, ['First', 'Third'])

    def test_empty_when_no_messages(self):
        res = self.client.get('/api/announcements/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['results'], [])

    def test_no_auth_required(self):
        AnnouncementMessage.objects.create(text='Public message')
        res = self.client.get('/api/announcements/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['results']), 1)
