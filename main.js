const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, powerMonitor } = require('electron');
const path = require('path');

// Disable vsync và enable smooth scrolling
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');

let mainWindow;
let tray;
let droneCount = 1;

// ========== DEFAULT SETTINGS (thay đổi giá trị ở đây) ==========
const settings = {
    moveSpeed: { min: 20, max: 50 },     // Tốc độ di chuyển (px/s)
    spriteSpeed: 0.06,                   // Tốc độ xoay sprite (giây/frame, nhỏ = nhanh)
    hoverAmplitude: 0,                   // Biên độ hover (px, 0 = tắt)
    hoverPeriod: 500,                    // Chu kỳ hover (ms)
    collisionEnabled: false,              // Bật/tắt va chạm
    dragEnabled: false,                  // Bật/tắt kéo thả chuột
    theme: 'nemo',                       // Theme hiện tại
};
// ================================================================

function createTray() {
    // Dùng file PNG với suffix "Template" cho macOS
    const iconPath = path.join(__dirname, 'tray-iconTemplate.png');
    let trayIcon = nativeImage.createFromPath(iconPath);

    if (trayIcon.isEmpty()) {
        console.error('Tray icon is empty, using fallback');
        // Fallback: tạo icon 16x16 đơn giản
        trayIcon = nativeImage.createFromBuffer(
            Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
                0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,~
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, 0x61, 0x00, 0x00, 0x00,
                0x01, 0x73, 0x52, 0x47, 0x42, 0x00, 0xAE, 0xCE, 0x1C, 0xE9, 0x00, 0x00,
                0x00, 0x44, 0x49, 0x44, 0x41, 0x54, 0x38, 0x4F, 0x63, 0x60, 0x00, 0x02,
                0x46, 0x46, 0xC6, 0xFF, 0x0C, 0x0C, 0x0C, 0x40, 0x80, 0x00, 0x00, 0x06,
                0x06, 0x06, 0x20, 0xC6, 0x05, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
                0x44, 0xAE, 0x42, 0x60, 0x82
            ])
        );
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('Drone Desktop');
    updateTrayMenu();
}

function addDrones(n) {
    droneCount += n;
    mainWindow?.webContents.send('add-drones', n);
    updateTrayMenu();
}

function removeDrones(n) {
    const toRemove = Math.min(n, droneCount - 1);
    if (toRemove > 0) {
        droneCount -= toRemove;
        mainWindow?.webContents.send('remove-drones', toRemove);
        updateTrayMenu();
    }
}

function setDrones(n) {
    droneCount = n;
    mainWindow?.webContents.send('set-drones', n);
    updateTrayMenu();
}

function setMoveSpeed(min, max) {
    settings.moveSpeed = { min, max };
    mainWindow?.webContents.send('set-move-speed', { min, max });
    updateTrayMenu();
}

function setSpriteSpeed(speed) {
    settings.spriteSpeed = speed;
    mainWindow?.webContents.send('set-sprite-speed', speed);
    updateTrayMenu();
}

function setHover(amplitude, period) {
    settings.hoverAmplitude = amplitude;
    settings.hoverPeriod = period;
    mainWindow?.webContents.send('set-hover', { amplitude, period });
    updateTrayMenu();
}

function setCollision(enabled) {
    settings.collisionEnabled = enabled;
    mainWindow?.webContents.send('set-collision', enabled);
    updateTrayMenu();
}

function setDrag(enabled) {
    settings.dragEnabled = enabled;
    mainWindow?.setIgnoreMouseEvents(!enabled, { forward: true });
    mainWindow?.webContents.send('set-drag', enabled);
    updateTrayMenu();
}

function setTheme(themeId) {
    settings.theme = themeId;
    mainWindow?.webContents.send('set-theme', themeId);
    updateTrayMenu();
}

function updateTrayMenu() {
    const amounts = [1, 5, 10, 50, 100];

    const contextMenu = Menu.buildFromTemplate([
        {
            label: `Drones: ${droneCount}`,
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Add',
            submenu: amounts.map(n => ({
                label: `+${n}`,
                click: () => addDrones(n)
            }))
        },
        {
            label: 'Remove',
            submenu: amounts.map(n => ({
                label: `-${n}`,
                click: () => removeDrones(n)
            }))
        },
        {
            label: 'Set to...',
            submenu: [1, 3, 5, 10, 25, 50, 100, 200].map(n => ({
                label: `${n} drones`,
                click: () => setDrones(n)
            }))
        },
        { type: 'separator' },
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Move Speed',
                    submenu: [
                        { label: 'Very Slow (10-20)', click: () => setMoveSpeed(10, 20) },
                        { label: 'Slow (20-40)', click: () => setMoveSpeed(20, 40) },
                        { label: 'Normal (20-50)', type: 'checkbox', checked: settings.moveSpeed.min === 20 && settings.moveSpeed.max === 50, click: () => setMoveSpeed(20, 50) },
                        { label: 'Fast (40-80)', click: () => setMoveSpeed(40, 80) },
                        { label: 'Very Fast (60-120)', click: () => setMoveSpeed(60, 120) },
                    ]
                },
                {
                    label: 'Sprite Animation',
                    submenu: [
                        { label: 'Very Fast (0.03s)', click: () => setSpriteSpeed(0.03) },
                        { label: 'Fast (0.05s)', click: () => setSpriteSpeed(0.05) },
                        { label: 'Normal (0.06s)', type: 'checkbox', checked: settings.spriteSpeed === 0.06, click: () => setSpriteSpeed(0.06) },
                        { label: 'Slow (0.08s)', click: () => setSpriteSpeed(0.08) },
                        { label: 'Very Slow (0.12s)', click: () => setSpriteSpeed(0.12) },
                    ]
                },
                {
                    label: 'Hover Effect',
                    submenu: [
                        { label: 'Off', type: 'checkbox', checked: settings.hoverAmplitude === 0, click: () => setHover(0, 500) },
                        { label: 'Subtle (1.5px)', click: () => setHover(1.5, 500) },
                        { label: 'Normal (3px)', click: () => setHover(3, 500) },
                        { label: 'Strong (5px)', click: () => setHover(5, 500) },
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Collision',
                    type: 'checkbox',
                    checked: settings.collisionEnabled,
                    click: () => setCollision(!settings.collisionEnabled)
                },
                {
                    label: 'Drag with Mouse',
                    type: 'checkbox',
                    checked: settings.dragEnabled,
                    click: () => setDrag(!settings.dragEnabled)
                },
            ]
        },
        {
            label: 'Theme',
            submenu: [
                { label: 'Nemo Fish', type: 'checkbox', checked: settings.theme === 'nemo', click: () => setTheme('nemo') },
                { label: 'Blue Fish', type: 'checkbox', checked: settings.theme === 'blue', click: () => setTheme('blue') },
                { label: 'Drone', type: 'checkbox', checked: settings.theme === 'drone', click: () => setTheme('drone') },
            ]
        },
        { type: 'separator' },
        {
            label: 'Reset',
            click: () => mainWindow?.webContents.send('reset')
        },
        { type: 'separator' },
        {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => app.quit()
        }
    ]);

    tray.setContextMenu(contextMenu);
}

function updateWindowBounds() {
    if (!mainWindow) return;
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.webContents.send('screen-changed', { width, height });
}

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        }
    });

    // Click-through hoàn toàn
    mainWindow.setIgnoreMouseEvents(true);

    // Hiển thị trên tất cả workspaces và fullscreen
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // macOS: hiển thị trên lock screen (level cao hơn)
    if (process.platform === 'darwin') {
        app.dock.hide();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }

    mainWindow.loadFile('index.html');

    // Lắng nghe thay đổi màn hình
    screen.on('display-added', updateWindowBounds);
    screen.on('display-removed', updateWindowBounds);
    screen.on('display-metrics-changed', updateWindowBounds);

    // Tiếp tục chạy khi unlock
    powerMonitor.on('unlock-screen', () => {
        mainWindow?.webContents.send('resume');
    });
}

// IPC handlers
ipcMain.on('update-count', (event, count) => {
    droneCount = count;
    updateTrayMenu();
});

app.whenReady().then(() => {
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    app.quit();
});
