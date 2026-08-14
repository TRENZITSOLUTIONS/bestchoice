# EC2 instance role: scoped to just this one bucket's objects, nothing else -
# so the app server never needs (and can't leak) a static AWS access key.
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app_server" {
  name               = "${var.project}-app-server"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

data "aws_iam_policy_document" "s3_media_access" {
  statement {
    sid       = "ObjectReadWrite"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.media.arn}/*"]
  }
  statement {
    sid       = "ListBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.media.arn]
  }
}

resource "aws_iam_role_policy" "s3_media_access" {
  name   = "${var.project}-s3-media-access"
  role   = aws_iam_role.app_server.id
  policy = data.aws_iam_policy_document.s3_media_access.json
}

resource "aws_iam_instance_profile" "app_server" {
  name = "${var.project}-app-server"
  role = aws_iam_role.app_server.name
}
