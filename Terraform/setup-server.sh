#!/bin/bash
cd HeadInTheClouds
cd backend
npm run pm2restart:prod
cd ../frontend
npm run preview
