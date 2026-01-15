# Provider Block
provider "aws" {
  # profile    = "default" # AWS Credentials Profile configured on your local desktop terminal  $HOME/.aws/credentials
  region     = "eu-central-1"
}

data "aws_key_pair" "jivana_secret_key" {
  key_name = "jivana_secret_key"
}

