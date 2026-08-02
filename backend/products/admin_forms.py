from django import forms


class ProductCSVUploadForm(forms.Form):
    csv_file = forms.FileField(
        label='CSV file',
        help_text=(
            'Columns: name, category_slug, brand_slug (optional), short_description, '
            'description, mrp, selling_price, gst_included (true/false), weight_g, '
            'hide_if_out_of_stock (true/false), care_instructions, expiry_date (YYYY-MM-DD), '
            'batch_number, ingredients, usage_instructions, compatible_devices, warranty'
        ),
    )
