#!/bin/bash

# install calibre
echo "Installing calibre"
apt-get update -y
apt-get install -y libopengl0
apt-get install -y libegl1
apt-get install -y libxcb-cursor0
wget -nv -O- https://download.calibre-ebook.com/linux-installer.sh | sh /dev/stdin

# npm install
echo "Installing dependencies"
npm install --include=dev

if [ "$NODE_ENV" == "production" ]; then
    echo "Running prod"
    npm run prod
else
  echo "Running dev"
  npm run dev
fi
