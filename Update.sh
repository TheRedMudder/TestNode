#!/bin/bash

git checkout .
git pull origin master
npm install --silent
pm2 delete all
npm run deploy
