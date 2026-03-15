# ⚡ BootStuff

> Launch your entire work environment in one click.

BootStuff is an open source **cross-platform** system tray app built with Electron + React. Define workspace **profiles** — apps, browser tabs, terminal commands, volume, startup sound — and launch everything instantly from the tray or a global keyboard shortcut.

---

## ✨ Features

- 🖥️ **System tray** — lives quietly in your taskbar, out of the way
- 💼 **Multiple profiles** — Work, Personal, Gaming, anything
- 🌐 **Chrome window groups** — open multiple tabs in one Chrome window, per Chrome profile
- 💻 **Terminal commands** — auto-run `npm run dev`, `yarn start`, etc. in project folders
- 📋 **tasks.json import** — scan a VS Code workspace and import `runOn: folderOpen` tasks
- 🔊 **Volume control** — set system volume per profile
- 🎵 **Startup sound** — play a custom MP3/audio file when launching
- ⬆️ **Import startup script** — parse an existing `.bat` (Windows) or `.sh` (Mac/Linux) into a profile
- ⌨️ **Global keyboard shortcuts** — launch any profile from anywhere without opening the app
- 🔀 **Drag-to-reorder** — rearrange profiles in the sidebar
- ⧉ **Duplicate profiles** — clone a profile as a starting point
- 📝 **Launch log** — live feed of every action taken during a launch, with error badges
- 🚀 **Launch at startup** — start BootStuff automatically when you log in
- 🔇 **Start minimized** — boots silently to tray, no window shown
- 🔔 **Toast notifications** — Windows notification when a launch completes
- 💾 **Local storage** — all data stored locally via `electron-store`, no cloud required
- 🌍 **Cross-platform** — Windows, macOS, Linux

---

## 📥 Download

Grab the latest release for your OS from the [Releases page](https://github.com/Siddiqueath/bootstuff/releases/latest):

| OS | File | Notes |
|---|---|---|
| Windows | `BootStuff x.x.x.exe` | Portable — no install needed |
| macOS | `BootStuff-x.x.x.dmg` | Drag to Applications |
| Linux | `BootStuff-x.x.x.AppImage` | `chmod +x` then run |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **Windows**: [NirCmd](https://www.nirsoft.net/utils/nircmd.html) for volume control (place in `C:\Windows\System32\`)
- **macOS**: Volume control uses `osascript` (built-in)
- **Linux**: Volume control uses `pactl` (PulseAudio/PipeWire)

### Install & Run (Development)

```bash
git clone https://github.com/Siddiqueath/bootstuff.git
cd bootstuff

npm install
cd src/renderer && npm install && cd ../..

npm start
```

### Build

```bash
# Windows portable
npm run build:portable

# macOS DMG
npm run build:mac

# Linux AppImage
npm run build:linux

# All platforms (via GitHub Actions — recommended)
git tag v1.x.x && git push origin v1.x.x
```

### Deploy locally (Windows)

```powershell
npm run deploy
```

Builds and copies to `%LOCALAPPDATA%\BootStuff\BootStuff.exe` automatically.

---

## 🗂️ Project Structure

```
bootstuff/
├── .github/workflows/
│   └── build.yml           ← CI: auto-builds Win/Mac/Linux on tag push
├── assets/
│   ├── icon.png            ← 512×512 app icon
│   ├── icon_16.png         ← 16×16 tray icon
│   └── icon.ico            ← Windows ICO for installer
├── src/
│   ├── main/
│   │   ├── index.js        ← Electron main: tray, IPC, launcher
│   │   ├── platform.js     ← OS abstraction (Windows/Mac/Linux)
│   │   └── preload.js      ← Context bridge
│   └── renderer/
│       └── src/
│           ├── App.jsx
│           └── components/
│               ├── TitleBar.jsx
│               ├── Sidebar.jsx
│               ├── ProfileEditor.jsx
│               ├── ShortcutRecorder.jsx
│               ├── LaunchLog.jsx
│               ├── SettingsPanel.jsx
│               └── ConfirmModal.jsx
├── deploy.ps1              ← Windows one-command deploy script
└── package.json
```

---

## 🔧 Profile Schema

```json
{
  "id": "unique-string",
  "name": "Work",
  "icon": "💼",
  "volume": 75,
  "sound": "D:\\Music\\startup.mp3",
  "shortcut": "CommandOrControl+Shift+W",
  "apps": [
    { "path": "C:\\...\\Code.exe", "args": "D:\\Project --new-window", "delay": 1500 }
  ],
  "urlGroups": [
    { "chromeProfile": "Profile 2", "urls": ["https://gmail.com", "https://slack.com"] }
  ],
  "urls": [
    { "url": "https://example.com", "chromeProfile": "Default" }
  ],
  "commands": [
    { "path": "D:\\Project\\UI", "command": "yarn start" }
  ]
}
```

---

## 🤝 Contributing

PRs welcome! Open an issue first for major changes.

---

## 📄 License

MIT — free to use, modify, and distribute.
