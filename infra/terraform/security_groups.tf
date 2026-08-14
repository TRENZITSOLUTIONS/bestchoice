# EC2: the app server. Public web traffic in, SSH restricted to your own IP.
resource "aws_security_group" "app" {
  name        = "${var.project}-app"
  description = "BestChoice app server - HTTP/HTTPS from anywhere, SSH from the admin's IP only"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH - admin only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-app" }
}

# RDS: only reachable from the app server's security group, never the internet -
# paired with "publicly_accessible = false" on the DB instance itself in rds.tf.
resource "aws_security_group" "db" {
  name        = "${var.project}-db"
  description = "BestChoice RDS - Postgres from the app server only"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Postgres from the app server"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-db" }
}
