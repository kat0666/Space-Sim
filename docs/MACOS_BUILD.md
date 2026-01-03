# macOS Compilation Guide

## Overview

Yes, this Electron wrapper **fully supports macOS compilation**! The project is configured to build native macOS applications with the following features:

## macOS Build Features

### Universal Binary Support
The macOS build creates **universal binaries** that run natively on both:
- **Intel Macs** (x64 architecture)
- **Apple Silicon Macs** (arm64 architecture - M1, M2, M3, etc.)

This means users get optimal performance regardless of their Mac's processor.

### Package Format
- **DMG (Disk Image)**: The standard macOS installation format
- Users can drag and drop the app to their Applications folder
- Clean and familiar installation experience

### App Classification
- Categorized as "Education" in macOS
- Proper metadata for Spotlight and Finder

## Building on macOS

### Local Build (on a Mac)
```bash
# Install dependencies
npm install

# Build for macOS
npm run electron:build:mac

# The .dmg file will be in the release/ directory
```

### GitHub Actions Build
The project includes automated macOS builds via GitHub Actions:
- Runs on `macos-latest` (currently macOS 12 or later)
- Automatically builds when you push a version tag
- Creates DMG installers for distribution

## Icon
The app includes a 512x512 PNG icon that electron-builder automatically converts to:
- `.icns` format for macOS
- Multiple resolutions for different contexts (Finder, Dock, etc.)

## Testing on macOS
After building, you can test the app by:
1. Opening the DMG file from `release/` directory
2. Dragging the app to Applications
3. Double-clicking to launch

## Requirements for Building
- **Node.js 18+** (20 recommended)
- **macOS** (for local builds)
- **Xcode Command Line Tools** (installed automatically with Xcode or via `xcode-select --install`)

## Signing and Notarization (Optional)
For distribution outside the App Store, you may want to:
1. **Code sign** the app with an Apple Developer certificate
2. **Notarize** the app with Apple

This is not required for personal use or GitHub releases, but recommended for wider distribution.

To enable signing, update `package.json`:
```json
"mac": {
  "identity": "Your Developer ID",
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.plist"
}
```

## Troubleshooting

### "App is damaged" message
If users see this message, they may need to:
```bash
xattr -cr /Applications/Space\ Sim.app
```

This removes the quarantine attribute macOS adds to downloaded apps.

### Build Failures
- Ensure Xcode Command Line Tools are installed
- Check that you have enough disk space (macOS builds can be large)
- Verify Node.js version is 18 or higher
