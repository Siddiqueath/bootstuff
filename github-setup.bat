@echo off
:: ── BootStuff — GitHub first-push script ──────────────────────────────────
:: Run this from inside your bootstuff\ project folder
:: Requires: git installed, and the repo already created on GitHub
::
:: Repo: https://github.com/Siddiqueath/bootstuff
:: ──────────────────────────────────────────────────────────────────────────

echo.
echo [1/6] Initialising git repo...
git init

echo.
echo [2/6] Writing .gitignore...
(
echo node_modules/
echo dist/
echo out/
echo release/
echo src/renderer/dist/
echo src/renderer/node_modules/
echo *.log
echo .DS_Store
echo *.bak
echo assets/icon_16.png
echo assets/icon_32.png
echo assets/icon_256.png
) > .gitignore

echo.
echo [3/6] Staging all files...
git add .

echo.
echo [4/6] Creating initial commit...
git commit -m "feat: initial release v1.2

- Electron + React system tray app
- Multiple launch profiles (apps, URLs, terminal commands)
- Chrome window groups (multi-tab per window)
- .bat file import with full parser
- tasks.json auto-task import
- Drag-to-reorder profiles
- Duplicate profile
- Delete confirmation modal
- Live launch log with error badges
- Unsaved changes indicator + Ctrl+S
- Windows toast notification on launch complete
- Schema migration for existing data
- Generated tray icons (16px / 32px / 256px)"

echo.
echo [5/6] Adding remote origin...
git remote add origin https://github.com/Siddiqueath/bootstuff.git

echo.
echo [6/6] Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ✓ Done! Visit https://github.com/Siddiqueath/bootstuff
pause
