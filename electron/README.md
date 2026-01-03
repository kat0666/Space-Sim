# Electron Setup

This directory contains the Electron main process for the Space Sim application.

## Files

- `main.js` - Main Electron process that creates the application window and handles lifecycle events

## How it Works

The Electron app wraps the Vite-built web application:

1. In development (`npm run electron:dev`), it loads the Vite dev server
2. In production, it loads the built static files from `dist/`

## Building

The Electron app is built using `electron-builder` which creates native installers:

- **macOS**: Creates `.dmg` installer files for both Intel (x64) and Apple Silicon (arm64)
- **Windows**: Can create `.exe` installers (requires Windows or CI/CD)
- **Linux**: Can create `.AppImage`, `.deb`, or `.rpm` packages

## Architecture

The main process is kept minimal and secure:
- No Node integration in renderer
- Context isolation enabled
- All application logic runs in the renderer process
