const path = require('path');
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev ? true : false,
      // devTools: true,
    },
    // resizable: false,
    // transparent: false,
    // fullscreenable: false,
  })
  win.loadFile(`./app/index.html`);
  if(isDev) win.webContents.openDevTools();
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})