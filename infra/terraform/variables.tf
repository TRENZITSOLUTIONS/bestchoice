variable "aws_region" {
  description = "AWS region - ap-south-1 (Mumbai) matches the Tamil Nadu customer base."
  type        = string
  default     = "ap-south-1"
}

variable "project" {
  description = "Short name used as a prefix/tag on every resource, so they're easy to find and to delete together."
  type        = string
  default     = "bestchoice"
}

variable "my_ip_cidr" {
  description = "Your own IP in CIDR form (e.g. 49.37.12.5/32), for SSH access. Find it with `curl ifconfig.me`."
  type        = string
}

variable "ec2_instance_type" {
  description = "App server size. t3.medium is right-sized once Postgres is offloaded to RDS."
  type        = string
  default     = "t3.medium"
}

variable "rds_instance_class" {
  description = "Database size. db.t4g.micro comfortably covers a database this small (~10MB today)."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  type    = string
  default = "bestchoice_db"
}

variable "db_username" {
  type    = string
  default = "bestchoice"
}

variable "db_password" {
  description = "Set via TF_VAR_db_password env var or a .tfvars file that's gitignored - never commit this."
  type        = string
  sensitive   = true
}

variable "s3_bucket_name" {
  description = "Must be globally unique across all of AWS. e.g. bestchoice-media-<random suffix>."
  type        = string
}

variable "billing_alert_email" {
  description = "Email to notify when estimated charges cross the billing alarm threshold."
  type        = string
}

variable "billing_alert_threshold_usd" {
  description = "Monthly estimated-charges threshold in USD that triggers the billing alarm."
  type        = number
  default     = 50
}
