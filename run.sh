#!/bin/bash
cd "$(dirname "$0")"

# Kill process cũ nếu đang chạy
pkill -f "Electron.*Drone-Desktop" 2>/dev/null
pkill -f "electron.*Drone-Desktop" 2>/dev/null
pkill -f "Drone-Desktop.*electron" 2>/dev/null && echo "Killed old process." && sleep 1

# Cài đặt lần đầu nếu chưa có
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi

# Chạy background
nohup npx electron . > /dev/null 2>&1 &
echo "Drone Desktop started! Check menu bar for controls."
