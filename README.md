<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Space Sim - Stellar Gravity Simulator

A React + TypeScript application for simulating stellar bodies, orbital mechanics, and gravitational interactions. Available as a web app and desktop application (Electron).

View your app in AI Studio: https://ai.studio/apps/drive/1AgDV_QKyMmBzZPc3FG4uRcHAt7f6JCDx

[![Build & Test Pipeline](https://github.com/kat0666/Space-Sim/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/kat0666/Space-Sim/actions/workflows/build-and-test.yml)

## Download Desktop App

**Get the latest release:** [Download installers](https://github.com/kat0666/Space-Sim/releases/latest)

- **Windows**: Download the `.exe` installer
- **macOS**: Download the `.dmg` file  
- **Linux**: Download the `.AppImage` or `.deb` package

## Features

- 🌍 **N-Body Simulation**: Simulate gravitational interactions between multiple stellar bodies
- 🎯 **Interactive Canvas**: Click and drag to add celestial objects
- 🔬 **Physics Validation**: Built-in physics validator ensures accurate orbital mechanics
- 📊 **Real-time Analysis**: AI-powered simulation stability analysis
- 🎨 **Visualization**: Beautiful trails, colors, and camera controls

## Run Locally

**Prerequisites:**  Node.js 18+ and Rust (optional, for physics validator)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   Create a `.env.local` file and set the `GEMINI_API_KEY` to your Gemini API key

3. **Run the web app:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Build Desktop App (Electron)

1. **Run in development mode:**
   ```bash
   npm run electron:dev
   ```

2. **Build for your platform:**
   ```bash
   # Build for current platform
   npm run electron:build
   
   # Or build for specific platforms
   npm run electron:build:win    # Windows
   npm run electron:build:mac    # macOS
   npm run electron:build:linux  # Linux
   ```

3. **Find installers in `release/` directory**

## Testing & Validation

This repository includes comprehensive testing and validation tools:

### Repository Sanitizer
Enforces code hygiene and asset management:
```bash
node tools/repo-sanitizer/check.cjs
```

### Physics Validator
Validates orbital mechanics calculations:
```bash
cargo test --manifest-path tools/physics-validator/Cargo.toml
```

### Full Test Suite
```bash
# Frontend build
npm run build

# Run all validators
node tools/repo-sanitizer/check.cjs
cargo test --manifest-path tools/physics-validator/Cargo.toml
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and releases:
- ✅ Repository sanitization (disallowed files, LFS enforcement)
- ✅ Frontend build and testing
- ✅ Rust formatting and linting (if applicable)
- ✅ Physics validation tests
- ✅ Automated dependency updates via Dependabot
- ✅ Electron app builds and releases for Windows, macOS, and Linux

See [.github/workflows/build-and-test.yml](.github/workflows/build-and-test.yml) and [.github/workflows/electron-release.yml](.github/workflows/electron-release.yml) for details.

## Contributing

We welcome contributions! Please see:
- [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)
- [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- [Agents Documentation](agents/README.md) - How to use validators and extend the pipeline

### Code Owners
See [CODEOWNERS](.github/CODEOWNERS) for automatic review assignments.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Desktop**: Electron with electron-builder
- **Rendering**: HTML5 Canvas
- **AI**: Google Gemini API
- **Testing**: Rust (physics validator)
- **CI/CD**: GitHub Actions, Dependabot

## License

See [LICENSE](LICENSE) for details.

## Resources

- [Agents Documentation](agents/README.md) - Validators, CI pipeline, and physics domain info
- [Physics Validator](tools/physics-validator/) - Rust crate for orbital mechanics validation
- [Repository Sanitizer](tools/repo-sanitizer/) - Code hygiene enforcement
