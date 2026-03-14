# ⚡ BootStuff

> Launch your entire work environment in one click.

BootStuff is an open source Windows system tray app built with Electron + React. Define workspace **profiles** — apps, browser tabs, terminal commands, volume, startup sound — and launch everything instantly from the tray or the settings UI.

---

## ✨ Features

- 🖥️ **System tray** — lives quietly in your taskbar, out of the way
- 💼 **Multiple profiles** — Work, Personal, Gaming, anything
- 🌐 **Chrome window groups** — open multiple tabs in one Chrome window, per Chrome profile
- 💻 **Terminal commands** — auto-run `npm run dev`, `yarn start`, etc. in project folders
- 📋 **tasks.json import** — scan a VS Code workspace and import `runOn: folderOpen` tasks automatically
- 🔊 **Volume control** — set system volume per profile (requires NirCmd)
- 🎵 **Startup sound** — play a custom MP3 when launching
- ⬆️ **Import .bat** — parse an existing startup `.bat` file into a profile instantly
- 🔀 **Drag-to-reorder** — rearrange profiles in the sidebar
- ⧉ **Duplicate** — clone a profile as a starting point
- 📝 **Launch log** — live feed of every action taken during a launch, with error badges
- 💾 **Local storage** — all data stored locally via `electron-store`, no cloud required

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **Windows 10/11**
- **[NirCmd](https://www.nirsoft.net/utils/nircmd.html)** — for volume control. Place `nircmd.exe` in `C:\Windows\System32\` or set the path in Settings.

### Install & Run

```bash
# Clone the repo
git clone https://github.com/yourusername/bootstuff.git
cd bootstuff

# Install root dependencies
npm install

# Install renderer dependencies
cd src/renderer && npm install && cd ../..

# Start in development mode
npm start
```

### Build for Windows

```bash
npm run build
```

This builds the React renderer first, then packages with `electron-builder` into an NSIS installer at `dist/`.

---

## 🗂️ Project Structure

```
bootstuff/
├── assets/
│   ├── icon.png          ← 256×256 app icon
│   ├── icon_16.png       ← 16×16 tray icon
│   ├── icon_32.png       ← 32×32 tray icon
│   └── icon.ico          ← Windows ICO for installer (add manually)
├── src/
│   ├── main/
│   │   ├── index.js      ← Electron main: tray, IPC, launcher, .bat parser, tasks.json scanner
│   │   └── preload.js    ← Context bridge (IPC API exposed to renderer)
│   └── renderer/
│       ├── src/
│       │   ├── App.jsx
│       │   ├── index.css
│       │   └── components/
│       │       ├── TitleBar.jsx      ← Nav + save + import .bat
│       │       ├── Sidebar.jsx       ← Profile list, drag-reorder, duplicate
│       │       ├── ProfileEditor.jsx ← Full profile editor
│       │       ├── LaunchLog.jsx     ← Live launch activity feed
│       │       ├── SettingsPanel.jsx ← App settings
│       │       └── ConfirmModal.jsx  ← Delete confirmation
│       ├── index.html
│       └── vite.config.js
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

## ⚙️ VS Code tasks.json Integration

BootStuff can import `runOn: folderOpen` tasks from `.vscode/tasks.json`. In the Profile Editor, click **⬆ Import tasks.json** and select your workspace folder.

> **Note:** For tasks to actually auto-run when VS Code opens the folder, you need `task.allowAutomaticTasks: on` in your VS Code user settings.

---

## 📦 Building an .ico icon

The installer requires `assets/icon.ico`. Generate one from `icon.png` using:

```bash
# Using ImageMagick
magick assets/icon.png -define icon:auto-resize=256,64,48,32,16 assets/icon.ico
```

---

## 🤝 Contributing

PRs welcome! Open an issue first for major changes.

---

## 📄 License

MIT — free to use, modify, and distribute.
