#!/bin/bash

git reset --hard
git pull origin master
npm install --silent
pm2 delete all
npm run deploy