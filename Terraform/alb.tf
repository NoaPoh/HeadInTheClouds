resource "aws_lb" "sheleg-load-balancer" {
  name               = "sheleg-load-balancer"
  internal           = false
  security_groups    = [aws_security_group.web_server-lb.id, aws_security_group.internal.id]
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets
}

resource "aws_lb_target_group" "http" {
  name        = "http"
  target_type = "instance"
  port        = "3000"
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id

  health_check {
    path              = "/"
    protocol          = "HTTP"
    matcher           = "200"
    timeout             = 6   # 6 seconds timeout for health check response
    interval            = 6  # Health checks every 10 seconds
    healthy_threshold   = 2
    unhealthy_threshold = 3

  }
  tags = {
    Name = "sheleg-http-target-group"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.sheleg-load-balancer.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.http.arn
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "backend"
  target_type = "instance"
  port        = 3010
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_lb_listener_rule" "static" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  condition {
    path_pattern {
      values = ["/api/*"] 
    }
  }
}

# resource "aws_lb_target_group_attachment" "sheleg-attachment" {
#   target_group_arn = aws_lb_target_group.http.arn
#   target_id        = aws_instance.sheleg-instance.id
#   port             = 3000
# }






