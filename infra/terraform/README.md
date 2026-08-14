# BestChoice infrastructure (Terraform)

Creates every resource discussed for the new AWS account: security groups, an
IAM role scoped to one S3 bucket, the S3 bucket itself with a public-read
media policy, an RDS Postgres instance, an EC2 app server, an Elastic IP, and
5 CloudWatch alarms (including a billing alarm) - all in the account's
**default VPC** (no custom VPC/subnets/routing - see "Why the default VPC?"
below).

Deliberately **not** included, because they need a domain/registrar or a
running server to make sense, not a blank AWS account:
- DNS (point your registrar's A record at `ec2_public_ip` once `apply` finishes)
- TLS certificate (run certbot on the box after DNS resolves to it - same as
  the current server)
- CloudFront (optional performance add-on, not required to run the site -
  add it later, purely additive)

## Prerequisites

1. **Terraform** installed (`brew install terraform` on Mac).
2. **AWS CLI credentials configured locally** - `aws configure`, using an IAM
   user's access key (not root). This is what lets Terraform act on your
   behalf; it runs on your machine, no credential is ever shared with anyone
   else.
3. **Enable billing alerts** once, by hand: Billing console → Billing
   preferences → check "Receive Billing Alerts". This is an account-level
   toggle Terraform can't set - the billing alarm won't fire without it.
4. **Your own public IP**, for SSH access: `curl ifconfig.me`, then use it as
   `<that-ip>/32`.
5. **A globally-unique S3 bucket name** - bucket names are unique across ALL
   of AWS, not just your account. Something like `bestchoice-media-<random
   suffix>` is safest.

## Run it

```bash
cd infra/terraform
terraform init

terraform apply \
  -var="my_ip_cidr=<your-ip>/32" \
  -var="s3_bucket_name=<your-unique-bucket-name>" \
  -var="billing_alert_email=<your-email>" \
  -var="db_password=<a-strong-password>"
```

Terraform shows exactly what it's about to create and asks for confirmation
before touching anything. Review the plan before typing `yes`.

**Check your inbox** after `apply` finishes - AWS emails a confirmation link
for the SNS alert subscriptions (2 emails: one for the general alerts topic,
one for the billing topic in us-east-1). Alarms won't actually notify you
until those links are clicked.

Get the SSH key and connect:
```bash
terraform output -raw ssh_private_key > bestchoice-new.pem
chmod 600 bestchoice-new.pem
ssh -i bestchoice-new.pem ubuntu@$(terraform output -raw ec2_public_ip)
```

From there, follow the existing `docs/DEPLOYMENT.md` / `docs/SETUP.md` in this
repo to install Docker, clone the app, and bring up the compose stack -
pointing `DATABASE_URL` at `terraform output rds_endpoint` instead of the
in-container Postgres the current server uses.

## Tear it down

```bash
terraform destroy \
  -var="my_ip_cidr=<your-ip>/32" \
  -var="s3_bucket_name=<your-unique-bucket-name>" \
  -var="billing_alert_email=<your-email>" \
  -var="db_password=<a-strong-password>"
```

Removes everything, in the correct reverse order, automatically. No manual
console cleanup, no leftover resources, no surprise bill. (Pass the same
variable values you used for `apply` - Terraform needs them to know exactly
what it's tearing down.)

## Why the default VPC?

Every AWS account already gets a default VPC per region - a public subnet per
AZ, an Internet Gateway, and a route table, all pre-wired. Building a custom
VPC with real private subnets is the more "textbook" approach, but for a
store this size it's meaningfully more setup for very little actual benefit.
The RDS instance still ends up just as unreachable from the internet, via two
things this config already does:
- `publicly_accessible = false` on the DB instance (no public IP/DNS at all)
- Its security group only accepts traffic from the app server's security
  group, not the internet

## What this costs

Estimated, not exact - see the AWS Pricing Calculator (calculator.aws) for a
live quote before committing:

| Resource | Est. monthly cost (ap-south-1) |
|---|---|
| EC2 `t3.medium` | ~$36-40 |
| RDS `db.t4g.micro` + 20GB gp3 | ~$17-21 |
| S3 (a few MB of photos) | <$1 |
| Elastic IP (attached to a running instance) | $0 |
| CloudWatch alarms (5, under the 10-free tier) | $0 |
| **Total** | **~$53-61/mo** |

Cheaper AND safer than keeping Postgres in a container on a bigger box - see
the chat history / project notes for the full comparison.
