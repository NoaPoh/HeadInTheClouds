output "load_balancer_dns_name" {
  description = "DNS of the Application Load Balancer"
  value       = aws_lb.sheleg_alb.dns_name
}