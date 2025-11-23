# Quick Start Guide

## If npm is not recognized in your terminal:

### Option 1: Run this command in your terminal (Quick Fix)

```powershell
$env:Path += ";C:\Program Files\nodejs"
```

Then verify:

```powershell
npm --version
node --version
```

### Option 2: Use the fix script

```powershell
.\fix-path.ps1
```

### Option 3: Restart VS Code/Cursor

Close and reopen VS Code/Cursor completely. This will load the updated PATH.

## Start the Development Server

Once npm is working:

```powershell
cd Frontend
npm run dev
```

Then open your browser to: **http://localhost:3000**

## Permanent Fix

If you keep having this issue, the PATH was added to your user environment variables, but you may need to:

1. Close ALL terminal windows
2. Restart VS Code/Cursor completely
3. Open a new terminal

The PATH change should persist after a full restart.
