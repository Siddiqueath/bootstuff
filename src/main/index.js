const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, dialog, globalShortcut } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store();

// Parse a shell-style args string respecting quoted tokens
// e.g. '"D:\Lasso\UI" --new-window' → ['D:\Lasso\UI', '--new-window']
function parseArgs(str) {
  if (!str || !str.trim()) return [];
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of str) {
    if (ch === '"' || ch === "'") { inQuotes = !inQuotes; }
    else if (ch === ' ' && !inQuotes) { if (current) { result.push(current); current = ''; } }
    else { current += ch; }
  }
  if (current) result.push(current);
  return result;
}
let tray = null;
let settingsWindow = null;

const defaultProfiles = [
  { id: '1', name: 'Work', icon: '💼', volume: 50, sound: '', apps: [], urls: [], commands: [], urlGroups: [] },
  { id: '2', name: 'Personal', icon: '🏠', volume: 40, sound: '', apps: [], urls: [], commands: [], urlGroups: [] }
];

if (!store.get('profiles')) store.set('profiles', defaultProfiles);

// ── Launch log ────────────────────────────────────────────────────────────────
let launchLog = [];
function appendLog(profileId, type, message) {
  const entry = { profileId, type, message, ts: Date.now() };
  launchLog.push(entry);
  if (launchLog.length > 500) launchLog = launchLog.slice(-500);
  settingsWindow?.webContents.send('launch-log-entry', entry);
}

// ── Settings window ───────────────────────────────────────────────────────────
function createSettingsWindow() {
  if (settingsWindow) { settingsWindow.focus(); return; }
  const startMinimized = store.get('settings.startMinimized') || false;
  settingsWindow = new BrowserWindow({
    width: 960, height: 680, minWidth: 820, minHeight: 600,
    frame: false, resizable: true,
    show: !startMinimized,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    title: 'BootStuff'
  });
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    settingsWindow.loadURL('http://localhost:5173');
  } else {
    // In packaged app: __dirname = .../resources/app/src/main
    // renderer dist is at: .../resources/app/src/renderer/dist/index.html
    const rendererPath = path.join(__dirname, '..', 'renderer', 'dist', 'index.html');
    settingsWindow.loadFile(rendererPath).catch(err => {
      // Fallback: try alternate path (for different packaging layouts)
      const altPath = path.join(process.resourcesPath, 'app', 'src', 'renderer', 'dist', 'index.html');
      settingsWindow.loadFile(altPath).catch(() => {
        settingsWindow.loadURL(`file://${rendererPath}`);
      });
    });
  }
  if (startMinimized) settingsWindow.once('ready-to-show', () => settingsWindow && settingsWindow.hide());
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

// ── Profile launcher ──────────────────────────────────────────────────────────
async function launchProfile(profileId) {
  const profiles = store.get('profiles') || [];
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  appendLog(profileId, 'start', `Launching "${profile.name}"…`);

  if (profile.volume !== undefined) {
    const vol = Math.round((profile.volume / 100) * 65535);
    exec(`nircmd setsysvolume ${vol}`, (err) => {
      if (err) appendLog(profileId, 'warn', `Volume error: ${err.message}`);
      else appendLog(profileId, 'ok', `Volume set to ${profile.volume}%`);
    });
  }

  if (profile.sound) {
    // -WindowStyle Hidden prevents the PowerShell console window from appearing
    exec(`powershell -NoProfile -WindowStyle Hidden -Command "Add-Type -AssemblyName presentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([uri]'${profile.sound}'); $p.Volume = 0.9; $p.Play(); Start-Sleep -Seconds 300; $p.Close()"`);
    appendLog(profileId, 'ok', `Playing ${path.basename(profile.sound)}`);
  }

  await new Promise(r => setTimeout(r, 500));

  for (const appItem of profile.apps || []) {
    if (appItem.path) {
      try {
        // `start /max` opens the window maximized; title arg ("") is required by start
        const args = appItem.args ? appItem.args.trim() : '';
        const cmd = `start /max "" "${appItem.path}"${args ? ' ' + args : ''}`;
        exec(cmd);
        appendLog(profileId, 'ok', `Launched ${path.basename(appItem.path)}`);
      } catch (e) {
        appendLog(profileId, 'error', `Failed: ${appItem.path} — ${e.message}`);
      }
      await new Promise(r => setTimeout(r, appItem.delay ?? 500));
    }
  }

  const chromePath = store.get('settings.chromePath') || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  // URL Groups: multiple tabs in one Chrome window
  for (const group of profile.urlGroups || []) {
    if (!group.urls?.length) continue;
    const urlArgs = group.urls.map(u => `"${u}"`).join(' ');
    exec(`"${chromePath}" --profile-directory="${group.chromeProfile || 'Default'}" --new-window --start-maximized ${urlArgs}`);
    appendLog(profileId, 'ok', `Opened ${group.urls.length} tab(s) → Chrome ${group.chromeProfile || 'Default'}`);
    await new Promise(r => setTimeout(r, 400));
  }

  // Legacy single URLs
  for (const urlItem of profile.urls || []) {
    exec(`"${chromePath}" --profile-directory="${urlItem.chromeProfile || 'Default'}" --new-window --start-maximized "${urlItem.url}"`);
    appendLog(profileId, 'ok', `Opened ${urlItem.url}`);
    await new Promise(r => setTimeout(r, 300));
  }

  for (const cmd of profile.commands || []) {
    if (cmd.path && cmd.command) {
      try {
        spawn('cmd.exe', ['/k', `cd /d "${cmd.path}" && ${cmd.command}`], { detached: true, stdio: 'ignore' }).unref();
        appendLog(profileId, 'ok', `${cmd.command} in ${path.basename(cmd.path)}`);
      } catch (e) {
        appendLog(profileId, 'error', `Command failed: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  appendLog(profileId, 'done', `"${profile.name}" launched`);
}

// ── .bat parser ───────────────────────────────────────────────────────────────
function parseBatFile(batContent, fileName) {
  const profile = {
    id: Date.now().toString(),
    name: fileName || 'Imported Profile',
    icon: '📦',
    volume: 50,
    sound: '',
    apps: [],
    urls: [],
    urlGroups: [],
    commands: []
  };

  const volMatch = batContent.match(/nircmd setsysvolume (\d+)/i);
  if (volMatch) profile.volume = Math.round((parseInt(volMatch[1]) / 65535) * 100);

  const soundMatch = batContent.match(/\[uri\]'([^']+\.mp3)'/i);
  if (soundMatch) profile.sound = soundMatch[1];

  // Chrome invocations → URL groups
  const chromeRe = /start\s+["]{0,2}[^"]*["]{0,2}\s+"[^"]*chrome\.exe"\s+(.*)/gi;
  let cm;
  while ((cm = chromeRe.exec(batContent)) !== null) {
    const args = cm[1];
    const profM = args.match(/--profile-directory="([^"]+)"/i);
    const chromeProf = profM ? profM[1] : 'Default';
    // Prefer quoted extraction — handles URLs with spaces (e.g. Azure DevOps "ISU - Lasso/...")
    let urls = [...args.matchAll(/"(https?:\/\/[^"]+)"/g)].map(m => m[1]);
    if (!urls.length) urls = [...args.matchAll(/(https?:\/\/[^\s"']+)/g)].map(m => m[1]);
    if (!urls.length) continue;
    if (urls.length === 1) {
      profile.urls.push({ url: urls[0], chromeProfile: chromeProf });
    } else {
      profile.urlGroups.push({ chromeProfile: chromeProf, urls });
    }
  }

  // Other start "" "path.exe" invocations
  const appRe = /^start\s+["]{2}\s+"([^"]+\.exe)"(.*)/gim;
  let am;
  while ((am = appRe.exec(batContent)) !== null) {
    const appPath = am[1];
    if (/chrome\.exe/i.test(appPath)) continue;
    if (/Code\.exe/i.test(appPath)) {
      // VS Code — extract workspace arg
      const wsM = am[2].match(/"([^"]+)"/);
      const ws = wsM ? wsM[1] : '';
      profile.apps.push({ path: appPath, args: ws ? `"${ws}" --new-window` : '--new-window', delay: 1500 });
      if (ws) profile.commands.push({ path: ws, command: '# VS Code opens this workspace automatically' });
    } else if (/ms-teams/i.test(appPath)) {
      profile.apps.push({ path: appPath, args: '', delay: 500 });
    } else {
      profile.apps.push({ path: appPath, args: am[2].trim(), delay: 500 });
    }
  }

  return profile;
}

// ── tasks.json scanner ────────────────────────────────────────────────────────
function scanTasksJson(folderPath) {
  const tasksPath = path.join(folderPath, '.vscode', 'tasks.json');
  if (!fs.existsSync(tasksPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    return (data.tasks || [])
      .filter(t => t.runOptions?.runOn === 'folderOpen')
      .map(t => ({ path: folderPath, command: t.command, label: t.label }));
  } catch { return null; }
}


// ── Global shortcuts ──────────────────────────────────────────────────────────
function registerProfileShortcuts() {
  globalShortcut.unregisterAll();
  const profiles = store.get('profiles') || [];
  for (const profile of profiles) {
    if (!profile.shortcut) continue;
    try {
      const registered = globalShortcut.register(profile.shortcut, () => {
        launchProfile(profile.id);
        // If window is open, switch to log view
        settingsWindow?.webContents.send('shortcut-launched', profile.id);
      });
      if (!registered) {
        console.warn(`Shortcut ${profile.shortcut} for "${profile.name}" could not be registered (already in use)`);
      }
    } catch (e) {
      console.warn(`Invalid shortcut "${profile.shortcut}" for profile "${profile.name}":`, e.message);
    }
  }
}

// ── Schema migration — ensure all profiles have urlGroups field ───────────────
function migrateProfiles() {
  const profiles = store.get('profiles') || [];
  let changed = false;
  const migrated = profiles.map(p => {
    if (!p.urlGroups) { changed = true; return { ...p, urlGroups: [] }; }
    return p;
  });
  if (changed) store.set('profiles', migrated);
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function buildTrayMenu() {
  const profiles = store.get('profiles') || [];
  return Menu.buildFromTemplate([
    { label: 'BootStuff', enabled: false },
    { type: 'separator' },
    ...profiles.map(p => ({ label: `${p.icon}  Launch ${p.name}`, click: () => launchProfile(p.id) })),
    { type: 'separator' },
    { label: '⚙️  Settings', click: createSettingsWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  app.setAppUserModelId('com.bootstuff.app');
  migrateProfiles();
  registerProfileShortcuts();

  // Load tray icon — prefer 16px, fall back to main icon, then empty
  let icon = nativeImage.createEmpty();
  const icon16Path = path.join(__dirname, '../../assets/icon_16.png');
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  if (fs.existsSync(icon16Path)) icon = nativeImage.createFromPath(icon16Path);
  else if (fs.existsSync(iconPath)) icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('BootStuff — double-click to open settings');
  tray.setContextMenu(buildTrayMenu());
  tray.on('double-click', createSettingsWindow);

  ipcMain.handle('get-profiles', () => store.get('profiles') || []);
  ipcMain.handle('save-profiles', (_, profiles) => {
    store.set('profiles', profiles);
    tray.setContextMenu(buildTrayMenu());
    registerProfileShortcuts();
    return true;
  });
  ipcMain.handle('launch-profile', async (_, profileId) => {
    const profiles = store.get('profiles') || [];
    const profile = profiles.find(p => p.id === profileId);
    if (profile) tray.setToolTip(`⚡ Launching ${profile.name}…`);
    await launchProfile(profileId);
    tray.setToolTip('BootStuff — double-click to open settings');
    // Windows toast notification
    try {
      const { Notification } = require('electron');
      if (Notification.isSupported()) {
        new Notification({
          title: 'BootStuff',
          body: `${profile?.icon || '⚡'} ${profile?.name || ''} launched successfully`,
          silent: true
        }).show();
      }
    } catch (_) {}
  });
  ipcMain.handle('get-settings', () => store.get('settings') || {});
  ipcMain.handle('save-settings', (_, settings) => { store.set('settings', settings); return true; });
  ipcMain.handle('get-launch-log', () => launchLog);

  ipcMain.handle('check-shortcut', (_, accelerator) => {
    if (!accelerator) return { valid: false, taken: false };
    try {
      // Check if we already own this shortcut (profile already has it)
      const alreadyOurs = globalShortcut.isRegistered(accelerator);
      if (alreadyOurs) return { valid: true, taken: false };

      // Try to register it temporarily to test validity + system availability
      const reg = globalShortcut.register(accelerator, () => {});
      if (reg) {
        globalShortcut.unregister(accelerator);
        registerProfileShortcuts(); // restore existing shortcuts
        return { valid: true, taken: false };
      } else {
        // register() returned false = taken by another app
        return { valid: true, taken: true };
      }
    } catch (e) {
      // Throws if accelerator format is invalid
      return { valid: false, taken: false, error: e.message };
    }
  });

  // u2500u2500 Windows startup (HKCU Run registry via Electron API) u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500
  ipcMain.handle('get-startup-enabled', () => {
    const isDev = process.env.NODE_ENV === 'development';
    try {
      const { openAtLogin } = app.getLoginItemSettings();
      return { enabled: openAtLogin, isDev };
    } catch (e) {
      return { enabled: false, isDev };
    }
  });

  ipcMain.handle('set-startup-enabled', (_, enable) => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) return { ok: false, isDev: true };
    try {
      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: true,
        name: 'BootStuff',
        path: app.getPath('exe')
      });
      // Verify it actually took effect
      const { openAtLogin } = app.getLoginItemSettings();
      return { ok: true, enabled: openAtLogin };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle('import-bat-file', async () => {
    const result = await dialog.showOpenDialog(settingsWindow, {
      title: 'Import .bat startup file',
      filters: [{ name: 'Batch Files', extensions: ['bat', 'cmd'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths.length) return null;
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    return parseBatFile(content, path.basename(filePath, path.extname(filePath)));
  });

  ipcMain.handle('scan-tasks-json', async (_, folderPath) => {
    if (!folderPath) {
      // Note: openDirectory uses filePaths (not directoryPaths) in Electron
      const result = await dialog.showOpenDialog(settingsWindow, {
        title: 'Select VS Code workspace folder',
        properties: ['openDirectory']
      });
      if (result.canceled || !result.filePaths?.length) return null;
      folderPath = result.filePaths[0];
    }
    const tasks = scanTasksJson(folderPath);
    if (!tasks) return { error: 'No .vscode/tasks.json found in that folder, or no runOn:folderOpen tasks defined.' };
    if (tasks.length === 0) return { error: 'tasks.json found but no tasks have runOn: folderOpen set.' };
    return tasks;
  });

  ipcMain.on('close-window', () => settingsWindow?.close());
  ipcMain.on('minimize-window', () => settingsWindow?.minimize());
  ipcMain.on('maximize-window', () => {
    if (settingsWindow?.isMaximized()) settingsWindow.unmaximize();
    else settingsWindow?.maximize();
  });
});

app.on('window-all-closed', (e) => e.preventDefault());
app.on('will-quit', () => globalShortcut.unregisterAll());
