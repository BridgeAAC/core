const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridgeDesktop', {
  onOpenFile(callback) {
    ipcRenderer.on('bridge:open-file', (_event, payload) => {
      callback(payload);
    });
    ipcRenderer.send('bridge:renderer-ready');
  },
});
