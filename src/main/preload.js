const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bootstuff', {
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  saveProfiles: (profiles) => ipcRenderer.invoke('save-profiles', profiles),
  launchProfile: (profileId) => ipcRenderer.invoke('launch-profile', profileId),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getLaunchLog: () => ipcRenderer.invoke('get-launch-log'),
  importBatFile: () => ipcRenderer.invoke('import-bat-file'),
  scanTasksJson: (folderPath) => ipcRenderer.invoke('scan-tasks-json', folderPath),
  onLaunchLogEntry: (cb) => ipcRenderer.on('launch-log-entry', (_, entry) => cb(entry)),
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
});
