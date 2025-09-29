const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('synthIPC', {
  onGlobalKey: (cb) => ipcRenderer.on('global-key', (_e, data) => cb(data)),
  onGlobalMouseDown: (cb) => ipcRenderer.on('global-mouse-down', (_e, data) => cb(data)),
  onGlobalMouseMove: (cb) => ipcRenderer.on('global-mouse-move', (_e, data) => cb(data)),
  onGlobalWheel: (cb) => ipcRenderer.on('global-wheel', (_e, data) => cb(data)),
})
