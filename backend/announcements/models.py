from django.db import models


class AnnouncementMessage(models.Model):
    """One line of the scrolling ticker at the top of the storefront.

    Plain text only, no links - the ticker scrolls continuously, and a moving
    click target is bad UX. Ordered by sort_order, ties broken by id.
    """
    text = models.CharField(max_length=140)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.text
