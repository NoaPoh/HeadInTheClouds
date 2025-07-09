data "aws_availability_zones" "available" {
}

locals {
  vpc_name = "sehleg-vpc"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name           = local.vpc_name
  cidr           = "10.10.0.0/16"
  azs            = data.aws_availability_zones.available.names
  public_subnets = ["10.10.0.0/20", "10.10.16.0/20", "10.10.32.0/20"] # to have 3 subnets we created 3 IP ranges for 3 AZs

  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    Type                                      = "Public Subnets"
    "kubernetes.io/role/elb"                  = 1
    "kubernetes.io/cluster/${local.vpc_name}" = "shared"
  }

  map_public_ip_on_launch = true
}

