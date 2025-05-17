# Directory: terraform/

provider "aws" {
  region = var.region
}

# Predefined Security Group file (provided by instructor)
module "security_groups" {
  source = "./sg" # DO NOT MODIFY THIS
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "sheleg-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "sheleg-public-subnet"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "sheleg-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "sheleg-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Launch Template
resource "aws_launch_template" "sheleg_template" {
  name_prefix   = "sheleg-lt"
  image_id      = "ami-xxxxxxxxxxxxxxxxx" # REPLACE with prebuilt AMI ID
  instance_type = "t3.micro"

  vpc_security_group_ids = [module.security_groups.sg_id] # Provided SG

  user_data = filebase64("../scripts/user_data.sh")

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "sheleg-instance"
    }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "sheleg_asg" {
  name                      = "sheleg-asg"
  max_size                  = 2
  min_size                  = 2
  desired_capacity          = 2
  vpc_zone_identifier       = [aws_subnet.public.id]
  health_check_type         = "EC2"
  launch_template {
    id      = aws_launch_template.sheleg_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "sheleg-instance"
    propagate_at_launch = true
  }
}

# Load Balancer
resource "aws_lb" "sheleg_alb" {
  name               = "sheleg-alb"
  load_balancer_type = "application"
  subnets            = [aws_subnet.public.id]
  security_groups    = [module.security_groups.sg_id]

  tags = {
    Name = "sheleg-alb"
  }
}

resource "aws_lb_target_group" "sheleg_tg" {
  name     = "sheleg-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 6 # required for project
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "sheleg_listener" {
  load_balancer_arn = aws_lb.sheleg_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.sheleg_tg.arn
  }
}

resource "aws_autoscaling_attachment" "asg_alb_attachment" {
  autoscaling_group_name = aws_autoscaling_group.sheleg_asg.name
  target_group_arn       = aws_lb_target_group.sheleg_tg.arn
}