# Creating a Release

This document explains how to create a new release of the Space Sim desktop application.

## Automatic Release via GitHub Actions

The repository is configured to automatically build installers for Windows, macOS, and Linux when you create a new tag or manually trigger the workflow.

### Method 1: Create a Tag (Recommended)

1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The GitHub Actions workflow will automatically:
   - Build the application for Windows, macOS, and Linux
   - Create installers for each platform
   - Create a GitHub release with all installers attached

3. The release will be available at: `https://github.com/kat0666/Space-Sim/releases`

### Method 2: Manual Workflow Trigger

1. Go to the GitHub repository
2. Click on "Actions" tab
3. Select "Build and Release Electron App" workflow
4. Click "Run workflow"
5. Enter the version number (e.g., 1.0.0)
6. Click "Run workflow"

The workflow will build and create a release with the specified version.

## Build Artifacts

The workflow creates the following installers:

- **Windows**: `Space-Sim-Setup-{version}.exe` (NSIS installer)
- **macOS**: `Space-Sim-{version}.dmg` (Universal DMG for Intel and Apple Silicon Macs)
- **Linux**: 
  - `Space-Sim-{version}.AppImage` (AppImage, runs on most distributions)
  - `space-sim_{version}_amd64.deb` (Debian/Ubuntu package)

## Version Numbering

Follow semantic versioning (semver):
- `v1.0.0` - Major release
- `v1.1.0` - Minor release (new features)
- `v1.0.1` - Patch release (bug fixes)

## Before Creating a Release

1. Ensure all tests pass
2. Update version in `package.json`
3. Update CHANGELOG (if you have one)
4. Commit and push all changes
5. Create the tag

## Testing the Release

After the workflow completes:
1. Download the installer for your platform from the Releases page
2. Install and test the application
3. Verify all features work correctly
