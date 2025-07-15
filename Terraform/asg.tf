resource "aws_launch_template" "asg-launch-template" {
  name                   = "web_servers_lt"
  image_id               = data.aws_ami.last-amazon-linux.id
  key_name               = data.aws_key_pair.jivana_secret_key.key_name
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.web_servers.id, aws_security_group.internal.id]

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "web-servers"
    }
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl enable httpd
              systemctl start httpd
              TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
              -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

              INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" \
                http://169.254.169.254/latest/meta-data/instance-id)

              echo "<h1>Hello from EC2 Instance: $INSTANCE_ID</h1>" > /var/www/html/index.html
            EOF
  )
}

resource "aws_autoscaling_group" "asg" {
  name = "sheleg-asg"
  launch_template {
    id      = aws_launch_template.asg-launch-template.id
    version = aws_launch_template.asg-launch-template.latest_version
  }
  vpc_zone_identifier = module.vpc.public_subnets
  min_size            = 0
  max_size            = 2
  desired_capacity    = 2
  health_check_type   = "ELB"

  tag {
    key                 = "Name"
    value               = "sheleg-asg"
    propagate_at_launch = true
  }

  instance_refresh {
    strategy = "Rolling"
  }
}

resource "aws_autoscaling_attachment" "asg_alb_attachment_http" {
  autoscaling_group_name = resource.aws_autoscaling_group.asg.name
  lb_target_group_arn    = aws_lb_target_group.http.arn
}


