# Building the Mac Installer

This guide explains how to build the native macOS installer (.dmg) for Space Sim.

## Prerequisites

1. **macOS**: Building .dmg installers requires macOS
2. **Node.js 18+**: Install from [nodejs.org](https://nodejs.org)
3. **Dependencies**: Run `npm install` first

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the Mac installer
npm run electron:build:mac
```

The installer will be created in the `release/` directory.

## Build Output

The build creates installers in the `release/` directory:
- `Space Sim-{version}.dmg` - Universal installer
- `Space Sim-{version}-arm64.dmg` - Apple Silicon (M1/M2/M3) installer
- `Space Sim-{version}-x64.dmg` - Intel Mac installer

Where `{version}` is the version number from `package.json`.

## Adding Custom Icons (Optional)

For a better user experience, add custom icons:

1. Create a 1024x1024 PNG icon for your app
2. Convert it to ICNS format:

### Using built-in tools (macOS):

```bash
# Create iconset directory
mkdir icon.iconset

# Create required icon sizes
sips -z 16 16     icon-1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png

# Convert to ICNS
iconutil -c icns icon.iconset -o public/icon.icns

# Also copy a PNG version for the window icon
cp icon-1024.png public/electron-icon.png
```

### Using ImageMagick:

```bash
brew install imagemagick
convert icon-1024.png -resize 512x512 public/icon.icns
cp icon-1024.png public/electron-icon.png
```

## Development Mode

Test the Electron app in development mode:

```bash
npm run electron:dev
```

This opens the app with hot-reload and developer tools enabled.

## Troubleshooting

### "Code signing required"

For distribution, you'll need an Apple Developer account and code signing certificate. For local use, the unsigned app will work but show a security warning on first launch.

To bypass the security warning:
1. Right-click the app
2. Select "Open"
3. Click "Open" in the dialog

### Build fails with "Cannot find module"

Make sure you've run both:
```bash
npm install
npm run build
```

The web app must be built before creating the Electron installer.

## Customization

Edit `package.json` to customize:
- `build.appId`: Your app identifier
- `build.productName`: Display name
- `build.mac.category`: App Store category
- Version number in the main `version` field

## More Info

- [electron-builder documentation](https://www.electron.build/)
- [Electron documentation](https://www.electronjs.org/docs)
