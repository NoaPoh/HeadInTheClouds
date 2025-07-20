# resource "aws_instance" "sheleg-instance" {
#   ami           = data.aws_ami.last-amazon-linux.id
#   instance_type = "t2.micro"
# }

# most recent Amazon Linux 2023 AMI 
data "aws_ami" "last-amazon-linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-*"]
  }
  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

