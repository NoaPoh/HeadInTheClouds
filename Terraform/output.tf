output "AMI-ID" {
  value       = data.aws_ami.amzlinux.id
  description = "The AMI ID"
}

output "AMI-Name" {
  value       = data.aws_ami.amzlinux.name
  description = "The AMI Name"
}

output "public_ip" {
  value       = aws_instance.colman-demo.public_ip
  description = "The public IP of the web server"
}
