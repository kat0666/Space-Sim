const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Node.js features while keeping security in place
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
});
