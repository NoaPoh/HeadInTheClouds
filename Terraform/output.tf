output "AMI-ID" {
  value       = data.aws_ami.last-amazon-linux.id
  description = "The AMI ID"
}

output "AMI-Name" {
  value       = data.aws_ami.last-amazon-linux.name
  description = "The AMI Name"
}

output "public_ip" {
  value       = aws_instance.sheleg-instance.public_ip
  description = "The public IP of the web server"
}

output "elb_dns_name" {
  value       = aws_lb.sheleg-load-balancer.dns_name
  description = "The domain name of the load balancer"
}
