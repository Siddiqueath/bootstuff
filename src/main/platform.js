// ── Platform abstraction layer ────────────────────────────────────────────────
// All OS-specific logic lives here. The rest of the app imports from this file.

const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const PLATFORM = process.platform; // 'win32' | 'darwin' | 'linux'

module.exports = {
  PLATFORM,
  isWindows: PLATFORM === 'win32',
  isMac:     PLATFORM === 'darwin',
  isLinux:   PLATFORM === 'linux',

  // ── Default Chrome path ─────────────────────────────────────────────────────
  defaultChromePath() {
    if (PLATFORM === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    if (PLATFORM === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    return '/usr/bin/google-chrome';
  },

  // ── Set system volume (0-100) ───────────────────────────────────────────────
  setVolume(percent) {
    if (PLATFORM === 'win32') {
      const vol = Math.round((percent / 100) * 65535);
      return `nircmd setsysvolume ${vol}`;
    }
    if (PLATFORM === 'darwin') {
      return `osascript -e 'set volume output volume ${percent}'`;
    }
    return `pactl set-sink-volume @DEFAULT_SINK@ ${percent}%`;
  },

  // ── Play a sound file ───────────────────────────────────────────────────────
  playSoundCommand(filePath) {
    if (PLATFORM === 'win32') {
      return `powershell -NoProfile -WindowStyle Hidden -Command "Add-Type -AssemblyName presentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([uri]'${filePath}'); $p.Volume = 0.9; $p.Play(); Start-Sleep -Seconds 300; $p.Close()"`;
    }
    if (PLATFORM === 'darwin') {
      return `afplay "${filePath}"`;
    }
    return `paplay "${filePath}" 2>/dev/null || aplay "${filePath}"`;
  },

  // ── Launch an app maximized ─────────────────────────────────────────────────
  launchAppCommand(appPath, args) {
    const argStr = args ? ` ${args}` : '';
    if (PLATFORM === 'win32') {
      return `start /max "" "${appPath}"${argStr}`;
    }
    if (PLATFORM === 'darwin') {
      if (appPath.endsWith('.app') || appPath.includes('.app/')) {
        return `open -a "${appPath}"${args ? ` --args ${args}` : ''}`;
      }
      return `"${appPath}"${argStr}`;
    }
    return `"${appPath}"${argStr}`;
  },

  // ── Open a terminal and run a command ──────────────────────────────────────
  terminalCommand(workingDir, command) {
    if (PLATFORM === 'win32') {
      return { exe: 'cmd.exe', args: ['/k', `cd /d "${workingDir}" && ${command}`] };
    }
    if (PLATFORM === 'darwin') {
      const script = `tell application "Terminal" to do script "cd '${workingDir}' && ${command}"`;
      return { exe: 'osascript', args: ['-e', script] };
    }
    return { exe: 'x-terminal-emulator', args: ['-e', `bash -c "cd '${workingDir}' && ${command}; exec bash"`] };
  },

  // ── Windows startup ─────────────────────────────────────────────────────────
  getStartupEnabled() {
    if (PLATFORM === 'win32') {
      try {
        const result = execSync(
          'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v BootStuff',
          { encoding: 'utf8', windowsHide: true }
        );
        return result.includes('BootStuff');
      } catch { return false; }
    }
    if (PLATFORM === 'darwin') {
      const { app } = require('electron');
      return app.getLoginItemSettings().openAtLogin;
    }
    // Linux — check ~/.config/autostart/bootstuff.desktop
    const fs = require('fs');
    const desktopFile = path.join(os.homedir(), '.config', 'autostart', 'bootstuff.desktop');
    return fs.existsSync(desktopFile);
  },

  setStartupEnabled(enable, execPath) {
    if (PLATFORM === 'win32') {
      if (enable) {
        execSync(
          `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v BootStuff /t REG_SZ /d "\\"${execPath}\\"" /f`,
          { encoding: 'utf8', windowsHide: true }
        );
      } else {
        try {
          execSync(
            'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v BootStuff /f',
            { encoding: 'utf8', windowsHide: true }
          );
        } catch (_) {}
      }
      return true;
    }
    if (PLATFORM === 'darwin') {
      const { app } = require('electron');
      app.setLoginItemSettings({ openAtLogin: enable, openAsHidden: true });
      return true;
    }
    // Linux — create/remove .desktop autostart file
    const fs = require('fs');
    const autostartDir = path.join(os.homedir(), '.config', 'autostart');
    const desktopFile = path.join(autostartDir, 'bootstuff.desktop');
    if (enable) {
      if (!fs.existsSync(autostartDir)) fs.mkdirSync(autostartDir, { recursive: true });
      fs.writeFileSync(desktopFile, [
        '[Desktop Entry]',
        'Type=Application',
        'Name=BootStuff',
        `Exec="${execPath}"`,
        'Hidden=false',
        'NoDisplay=false',
        'X-GNOME-Autostart-enabled=true',
      ].join('\n') + '\n');
    } else {
      if (fs.existsSync(desktopFile)) fs.unlinkSync(desktopFile);
    }
    return true;
  },

  // ── UI hints for the renderer ───────────────────────────────────────────────
  uiHints() {
    if (PLATFORM === 'win32') return {
      appPlaceholder:    'C:\\Path\\To\\App.exe',
      soundPlaceholder:  'D:\\Music\\startup.mp3',
      folderPlaceholder: 'D:\\Project\\folder',
      chromePlaceholder: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      nircmdVisible:     true,
      importLabel:       'Import .bat',
      importFileTypes:   [{ name: 'Batch Files', extensions: ['bat', 'cmd'] }],
    };
    if (PLATFORM === 'darwin') return {
      appPlaceholder:    '/Applications/Slack.app',
      soundPlaceholder:  '/Users/you/Music/startup.mp3',
      folderPlaceholder: '/Users/you/projects/myapp',
      chromePlaceholder: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      nircmdVisible:     false,
      importLabel:       'Import .sh',
      importFileTypes:   [{ name: 'Shell Scripts', extensions: ['sh', 'command', 'zsh'] }],
    };
    return {
      appPlaceholder:    '/usr/bin/code',
      soundPlaceholder:  '/home/you/music/startup.mp3',
      folderPlaceholder: '/home/you/projects/myapp',
      chromePlaceholder: '/usr/bin/google-chrome',
      nircmdVisible:     false,
      importLabel:       'Import .sh',
      importFileTypes:   [{ name: 'Shell Scripts', extensions: ['sh', 'bash', 'zsh'] }],
    };
  },

  // ── Shell script parser (.sh / Mac / Linux) ─────────────────────────────────
  parseShellFile(shContent, fileName) {
    const profile = {
      id: Date.now().toString(),
      name: fileName || 'Imported Profile',
      icon: '📦',
      volume: 50, sound: '',
      apps: [], urls: [], urlGroups: [], commands: []
    };

    // Volume
    const macVolMatch = shContent.match(/set volume output volume (\d+)/i);
    if (macVolMatch) profile.volume = parseInt(macVolMatch[1]);
    const linuxVolMatch = shContent.match(/pactl set-sink-volume[^%]+?(\d+)%/i);
    if (linuxVolMatch) profile.volume = parseInt(linuxVolMatch[1]);

    // Sound
    const soundMatch = shContent.match(/(?:afplay|paplay|aplay)\s+"?([^"\n]+\.(?:mp3|wav|ogg|m4a))"?/i);
    if (soundMatch) profile.sound = soundMatch[1].trim();

    // Chrome with --args (Mac style)
    const chromeRe = /open\s+-a\s+"Google Chrome"\s+--args\s+(.*)/gi;
    let cm;
    while ((cm = chromeRe.exec(shContent)) !== null) {
      const urls = [...cm[1].matchAll(/"(https?:\/\/[^"]+)"/g)].map(m => m[1]);
      if (!urls.length) continue;
      if (urls.length === 1) profile.urls.push({ url: urls[0], chromeProfile: 'Default' });
      else profile.urlGroups.push({ chromeProfile: 'Default', urls });
    }

    // open "https://..." bare URLs
    const openUrlRe = /^open\s+"(https?:\/\/[^"]+)"/gim;
    let om;
    while ((om = openUrlRe.exec(shContent)) !== null) {
      profile.urls.push({ url: om[1], chromeProfile: 'Default' });
    }

    // open -a "App.app" (not Chrome, not URLs)
    const appRe = /^open\s+(?:-a\s+)?"([^"]+\.app)"/gim;
    let am;
    while ((am = appRe.exec(shContent)) !== null) {
      if (/chrome/i.test(am[1])) continue;
      profile.apps.push({ path: am[1], args: '', delay: 500 });
    }

    // cd /path && command
    const cmdRe = /cd\s+"?([^"\n&&;]+)"?\s*&&\s*(.+)/gi;
    let cmdm;
    while ((cmdm = cmdRe.exec(shContent)) !== null) {
      const dir = cmdm[1].trim();
      const cmd = cmdm[2].trim();
      if (dir && cmd) profile.commands.push({ path: dir, command: cmd });
    }

    return profile;
  },
};
