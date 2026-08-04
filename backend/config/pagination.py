from rest_framework.pagination import PageNumberPagination


class SizedPageNumberPagination(PageNumberPagination):
    """Page number pagination that actually honours ?page_size=.

    The stock class ignores the parameter unless page_size_query_param is set,
    which is only settable on the class - there is no DRF setting for it. That
    silently capped anything asking for a bigger page at PAGE_SIZE: the sitemap
    requests 500 products and was quietly getting 20, so all but the first 20
    product URLs were missing from it.
    """

    page_size_query_param = 'page_size'
    # Generous enough for the sitemap's 500, low enough that a hostile
    # ?page_size=100000 can't be used to force huge serialisations.
    max_page_size = 500
