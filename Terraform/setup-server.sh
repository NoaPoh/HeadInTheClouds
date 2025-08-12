#!/bin/bash
echo "User data started at $(date)" >> /var/log/user-data-custom.log 2>&1
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs git unzip
sudo npm install pm2@latest -g
git clone https://yehonatan930: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@github.com/NoaPoh/HeadInTheClouds.git
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
cd HeadInTheClouds
cd backend
npm i
npm run prod
cd ../frontend
npm i -g http-server
npm i
rm -rf node_modules/.vite
NODE_OPTIONS="--max-old-space-size=2048" npm run build
http-server ./build  -p 3000
echo "User data finished at $(date)" >> /var/log/user-data-custom.log 2>&1
