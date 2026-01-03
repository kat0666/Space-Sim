# App Icons

This directory should contain app icons for the Electron application:

- `icon.icns` - macOS icon file (required for .dmg installer)
- `icon.png` - General purpose icon (256x256 or larger)
- `electron-icon.png` - Icon for the Electron window

## Creating Icons

You can use tools like `png2icns` to convert PNG images to ICNS format for macOS:

```bash
# Install png2icns (macOS)
brew install libicns

# Convert PNG to ICNS
png2icns icon.icns icon.png
```

For now, the build will work without icons, but they will enhance the user experience.
