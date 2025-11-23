# Installing Node.js and npm on Windows

## Option 1: Download from Official Website (Recommended)

1. **Visit the Node.js website:**
   - Go to https://nodejs.org/
   - Download the **LTS (Long Term Support)** version for Windows
   - Choose the Windows Installer (.msi) for your system (64-bit recommended)

2. **Run the Installer:**
   - Double-click the downloaded .msi file
   - Follow the installation wizard
   - Make sure to check "Add to PATH" option (usually checked by default)
   - Click "Install" and wait for installation to complete

3. **Verify Installation:**
   - Open PowerShell or Command Prompt
   - Run these commands to verify:
   ```bash
   node --version
   npm --version
   ```
   - You should see version numbers for both

4. **You're done!** Now you can use npm in the Frontend directory.

## Option 2: Using Chocolatey (If you have it)

If you have Chocolatey package manager installed:

```bash
choco install nodejs-lts
```

## Option 3: Using Winget (Windows Package Manager)

If you have Windows 10/11 with winget:

```bash
winget install OpenJS.NodeJS.LTS
```

## After Installation

Once Node.js is installed, navigate to the Frontend directory and run:

```bash
cd Frontend
npm install
npm run dev
```

## Troubleshooting

- **"npm is not recognized"**: Restart your terminal/PowerShell after installation
- **Permission errors**: Run PowerShell/CMD as Administrator
- **Version issues**: Make sure you downloaded the LTS version

