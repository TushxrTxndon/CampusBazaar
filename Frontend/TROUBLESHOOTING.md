# Troubleshooting Node.js Installation

## Issue: "node is not recognized" or "npm is not recognized"

This usually means Node.js isn't in your system PATH. Here's how to fix it:

## Solution 1: Restart Your Terminal (Try This First!)

1. **Close your current PowerShell/Command Prompt completely**
2. **Open a NEW PowerShell or Command Prompt window**
3. Try again:
   ```bash
   node --version
   npm --version
   ```

## Solution 2: Check if Node.js is Installed

1. Check if Node.js is installed in the default location:

   - Open File Explorer
   - Navigate to: `C:\Program Files\nodejs\`
   - If you see `node.exe` and `npm.cmd` files, Node.js is installed but not in PATH

2. If Node.js is installed but not in PATH:
   - Copy the path: `C:\Program Files\nodejs\`
   - Add it to your system PATH (see Solution 3)

## Solution 3: Add Node.js to PATH Manually

1. **Open System Environment Variables:**

   - Press `Windows + R`
   - Type: `sysdm.cpl` and press Enter
   - Click the "Advanced" tab
   - Click "Environment Variables"

2. **Edit PATH:**

   - Under "System variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\nodejs\`
   - Click "OK" on all windows

3. **Restart your terminal** and try again

## Solution 4: Reinstall Node.js

1. **Uninstall Node.js:**

   - Go to Settings > Apps
   - Search for "Node.js"
   - Click Uninstall

2. **Reinstall Node.js:**

   - Download from https://nodejs.org/
   - During installation, make sure to check:
     - ✅ "Add to PATH" option
     - ✅ "Automatically install necessary tools" (if prompted)

3. **Restart your computer** (recommended)
4. **Open a new terminal** and test:
   ```bash
   node --version
   npm --version
   ```

## Solution 5: Use Full Path (Temporary Workaround)

If you need to use Node.js immediately, you can use the full path:

```bash
"C:\Program Files\nodejs\node.exe" --version
"C:\Program Files\nodejs\npm.cmd" --version
```

Or navigate to the Node.js directory:

```bash
cd "C:\Program Files\nodejs"
.\node.exe --version
.\npm.cmd --version
```

## Quick Test Commands

After fixing, test with:

```bash
node --version
npm --version
where node
where npm
```

The `where` command will show you the full path where Node.js is found.

## Still Not Working?

1. Check if you have multiple Node.js installations
2. Try installing using Chocolatey: `choco install nodejs-lts`
3. Try installing using winget: `winget install OpenJS.NodeJS.LTS`
