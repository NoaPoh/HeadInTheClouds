locals {
  common_tags = {
      owner = "Eli"
      usage = "demo2"
  }
  vpc_name       = "colman-cloud-demo2"  # a name to our VPC
  vpc_cidr_block = "10.10.0.0/16" # the IP range for our whole VPC
  public_subnets = ["10.10.0.0/20", "10.10.16.0/20", "10.10.32.0/20"] # to have 3 subnets we created 3 IP ranges for 3 AZs
}
