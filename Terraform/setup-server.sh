# setup-server.sh
#!/bin/bash
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs git unzip
git clone https://github.com/NoaPoh/HeadInTheClouds.git
cd HeadInTheClouds
npm install pm2@latest -g
cd client
npm i
npm npm run build
rm -rf ../server/build
mv ./build ../server
cd ../server
npm i
npm run prod
