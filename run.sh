#!/bin/bash
cd "$(dirname "$0")"

# Cài đặt lần đầu nếu chưa có
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi

# Chạy background
nohup npx electron . > /dev/null 2>&1 &
echo "Drone Desktop started! Check menu bar for controls."
