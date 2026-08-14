resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnets"
  subnet_ids = data.aws_subnets.default.ids
  tags       = { Name = "${var.project}-db-subnets" }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "16"

  instance_class    = var.rds_instance_class
  allocated_storage = 20 # GB - RDS minimum; ~2000x today's actual 10MB database
  storage_type      = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  # Never internet-reachable, regardless of subnet - the app server (and only
  # the app server, via the security group above) can reach this.
  publicly_accessible = false

  multi_az = false # not worth 2x the cost at this scale - see infra/terraform/README.md

  backup_retention_period = 7
  backup_window           = "17:00-17:30" # UTC = 22:30-23:00 IST, off-hours

  # Both set for a clean test-and-tear-down cycle - `terraform destroy` just
  # deletes it, no leftover snapshot to clean up by hand. Once this is real
  # production (not a test), flip skip_final_snapshot to false and
  # deletion_protection to true so a stray `destroy` can't take the data with it.
  skip_final_snapshot = true
  deletion_protection = false

  tags = { Name = "${var.project}-db" }
}
