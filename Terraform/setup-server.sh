#!/bin/bash
echo "User data started at $(date)" >> /var/log/user-data-custom.log 2>&1
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs git unzip
sudo npm install pm2@latest -g
git clone https://yehonatan930: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@github.com/NoaPoh/HeadInTheClouds.git
cd HeadInTheClouds
cd frontend
npm i
npm run build
rm -rf ../backend/build
mv ./build ../backend
cd ../backend
npm i
npm run prod
echo "User data finished at $(date)" >> /var/log/user-data-custom.log 2>&1
