resource "aws_s3_bucket" "media" {
  bucket = var.s3_bucket_name
}

# ACLs disabled (bucket owner enforced) - matches AWS_DEFAULT_ACL = None in the
# Django app. Public read access is granted entirely via the bucket policy
# below, not per-object ACLs.
resource "aws_s3_bucket_ownership_controls" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Only the two "policy" blocks are unchecked - object/ACL-based public access
# stays blocked, since this bucket is never meant to accept public ACLs.
resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "media_public_read" {
  statement {
    sid       = "PublicReadGetObject"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.media.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "media_public_read" {
  bucket = aws_s3_bucket.media.id
  policy = data.aws_iam_policy_document.media_public_read.json

  # The policy attach must happen after public access is unblocked, or AWS
  # rejects it outright.
  depends_on = [aws_s3_bucket_public_access_block.media]
}
