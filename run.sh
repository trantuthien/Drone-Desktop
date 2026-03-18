#!/bin/bash
cd "$(dirname "$0")"

# Kiểm tra nếu app đã chạy
if pgrep -f "electron.*drone-desktop" > /dev/null; then
    echo "Drone Desktop is already running!"
    exit 0
fi

# Cài đặt lần đầu nếu chưa có
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi

# Chạy background
nohup npx electron . > /dev/null 2>&1 &
echo "Drone Desktop started! Check menu bar for controls."
