resource "aws_instance" "colman-demo" {
  ami           = data.aws_ami.amzlinux.id
  instance_type = "t2.micro"
}

data "aws_ami" "amzlinux" {
  most_recent  	= true
  owners       	= ["amazon"]
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

