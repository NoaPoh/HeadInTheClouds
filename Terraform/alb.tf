resource "aws_lb" "myalb" {
  name               = "myALB"
  internal           = false
  security_groups    = [ aws_security_group.web_server-lb.id, aws_security_group.internal.id ]
  load_balancer_type = "application"
  subnets = module.vpc.public_subnets
}

resource "aws_lb_target_group" "http" {
  name        = "http"
  target_type = "instance"
  port        = "80"
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id

  health_check {
    path     = "/"
    protocol = "HTTP"
    matcher  = "200"
    interval = 15
    healthy_threshold = 2

  }
  tags = {
    Name = "myTargetGroup"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.myalb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.http.arn
  }
}

output "elb_dns_name" {
  value       = aws_lb.myalb.dns_name
  description = "The domain name of the load balancer"
}



