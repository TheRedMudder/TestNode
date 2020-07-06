#!/bin/bash

git pull origin master
npm install
pm2 delete all
npm run deploy