#!/bin/bash
echo "User data started at $(date)" >> /var/log/user-data-custom.log 2>&1

# Start backend
cd /home/ec2-user/HeadInTheClouds/backend
NODE_OPTIONS="--max-old-space-size=2048" pm2 start dist/index.js --name "backend-app" --update-env

# Start frontend
cd /home/ec2-user/HeadInTheClouds/frontend
pm2 serve build 3000 --name "frontend-app" --spa --update-env

# Save PM2 processes so they restart after reboot
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "User data finished at $(date)" >> /var/log/user-data-custom.log 2>&1