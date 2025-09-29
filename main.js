const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('path')
let mainWindow
let tray

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })
  const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  mainWindow.loadURL(url)
  // Hide to tray instead of quitting when closed
  mainWindow.on('close', (e) => {
    if (app.isQuiting) return
    e.preventDefault()
    mainWindow.hide()
  })
}

app.whenReady().then(() => {
  createWindow()
  // Determine an icon path if available; fall back gracefully
  let iconPath
  const candidate = path.join(__dirname, 'app', 'public', 'vite.svg')
  try {
    iconPath = candidate
  } catch {}
  try {
    tray = new Tray(iconPath)
  } catch {
    tray = new Tray(undefined)
  }
  tray.setToolTip('Synth input listener')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => { if (mainWindow) mainWindow.show() } },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit() } }
  ])
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => { if (mainWindow) mainWindow.show() })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Global input via uiohook-napi
let hook
try {
  hook = require('uiohook-napi')
} catch (e) {
  console.warn('uiohook-napi not installed. Global input disabled.')
}

if (hook) {
  hook.uIOhook.on('keydown', (e) => {
    if (mainWindow) mainWindow.webContents.send('global-key', e)
  })
  hook.uIOhook.on('mousedown', (e) => {
    if (mainWindow) mainWindow.webContents.send('global-mouse-down', e)
  })
  hook.uIOhook.on('mousemove', (e) => {
    if (mainWindow) mainWindow.webContents.send('global-mouse-move', e)
  })
  hook.uIOhook.on('wheel', (e) => {
    if (mainWindow) mainWindow.webContents.send('global-wheel', e)
  })
  app.whenReady().then(() => hook.uIOhook.start())
  app.on('will-quit', () => hook.uIOhook.stop())
}
