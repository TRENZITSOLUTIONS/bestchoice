output "ec2_public_ip" {
  description = "Elastic IP - point your DNS A record here"
  value       = aws_eip.app.public_ip
}

output "ssh_private_key" {
  description = "Save this to a file (e.g. bestchoice-new.pem), chmod 600 it, then: ssh -i bestchoice-new.pem ubuntu@<ec2_public_ip>"
  value       = tls_private_key.ssh.private_key_pem
  sensitive   = true
}

output "rds_endpoint" {
  description = "Database host:port for the app's DATABASE_URL / .env"
  value       = aws_db_instance.main.endpoint
}

output "s3_bucket_name" {
  value = aws_s3_bucket.media.bucket
}

output "s3_bucket_domain" {
  description = "Value for AWS_S3_CUSTOM_DOMAIN / the direct media URL host"
  value       = aws_s3_bucket.media.bucket_regional_domain_name
}

output "iam_role_name" {
  description = "Confirms the instance role attached - no static AWS keys needed in .env"
  value       = aws_iam_role.app_server.name
}
