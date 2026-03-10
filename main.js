const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let droneCount = 3;

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
                0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
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
            contextIsolation: false
        }
    });

    // Click-through hoàn toàn
    mainWindow.setIgnoreMouseEvents(true);

    // Ẩn khỏi dock trên macOS
    if (process.platform === 'darwin') {
        app.dock.hide();
    }

    mainWindow.loadFile('index.html');

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
