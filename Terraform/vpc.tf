data "aws_availability_zones" "available" {
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  # VPC Basic Details
  name           = "sehleg-vpc"
  cidr           = "10.10.0.0/16"
  azs            = data.aws_availability_zones.available.names
  public_subnets = ["10.10.0.0/20", "10.10.16.0/20", "10.10.32.0/20"] # to have 3 subnets we created 3 IP ranges for 3 AZs

  # VPC DNS Parameters
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = local.common_tags
  vpc_tags             = local.common_tags

  # Additional Tags to Subnets
  public_subnet_tags = {
    Type                                    = "Public Subnets"
    "kubernetes.io/role/elb"                = 1
    "kubernetes.io/cluster/${vpc.vpc_name}" = "shared"
  }

  map_public_ip_on_launch = true
}

