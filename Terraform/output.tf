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

output "elb_dns_name" {
  value       = aws_lb.myalb.dns_name
  description = "The domain name of the load balancer"
}
