# Automated Agents & Testing Infrastructure

This directory documents the automated agents, validation tools, and testing infrastructure for the Space-Sim project.

## Overview

The Space-Sim repository uses a comprehensive Build & Test pipeline that enforces code quality, validates physics calculations, and maintains repository hygiene.

## Agents & Tools

### 1. Repository Sanitizer (`tools/repo-sanitizer/check.cjs`)

A pure Node.js script that enforces repository hygiene and asset management rules.

**Purpose:** Ensure the repository remains clean, organized, and properly configured for collaboration.

**Features:**
- ❌ **Disallowed File Detection**: Fails on compiled binaries (`.exe`, `.dll`, `.so`, `.dylib`, `.class`, `.pyc`, `.jar`, `.pdb`, `.o`, `.obj`)
- ⚠️ **Large File Warnings**: Warns about files larger than 50 MB
- 📦 **Git LFS Enforcement**: Requires files > 1 MB to be tracked with Git LFS
- 🔍 **Binary File Detection**: Scans for NULL bytes in files with text extensions
- 🏗️ **Tech Stack Detection**: Auto-detects TypeScript, React, Rust, Tauri, Babylon.js, WebGPU/WebGL2 usage
- ⚙️ **Configuration Validation**: Checks for missing config files based on detected tech stacks

**Running Locally:**
```bash
node tools/repo-sanitizer/check.cjs
```

**Configuration:**
- **`.repo-sanitizer-ignore`**: Add patterns (like `.gitignore`) to exclude files from sanitization
- **`.gitattributes`**: Configure Git LFS patterns for large assets
- **Environment Variables**:
  - `SANITIZER_STRICT=true`: Escalate warnings to errors

**Exit Codes:**
- `0`: Success (may include warnings)
- `1`: Failure (errors found)

### 2. Physics Validator (`tools/physics-validator/`)

A Rust crate containing validated implementations of fundamental physics formulas used in space simulations.

**Purpose:** Ensure physics calculations in the simulation are accurate and match real-world physics.

**Domain Coverage:**
- 🌍 **Orbital Mechanics**
  - Orbital velocity: `v = √(G·M/r)`
  - Orbital period: `T = 2π√(r³/(G·M))`
  - Escape velocity: `v_esc = √(2·G·M/r)`
  
- 🎯 **Gravitational Physics**
  - Gravitational force: `F = G·m₁·m₂/r²`
  - Gravitational acceleration: `a = G·M/r²`
  
- ✅ **Validation Tests**
  - LEO (Low Earth Orbit) parameters
  - Geostationary orbit calculations
  - ISS orbital mechanics
  - Moon orbital parameters
  - Kepler's Third Law verification
  - Inverse square law validation
  - Energy balance in circular orbits

**Running Locally:**
```bash
# Run all physics validator tests
cargo test --manifest-path tools/physics-validator/Cargo.toml

# Run with verbose output
cargo test --manifest-path tools/physics-validator/Cargo.toml -- --nocapture

# Run specific test
cargo test --manifest-path tools/physics-validator/Cargo.toml test_orbital_velocity_leo
```

**Test Characteristics:**
- **Deterministic**: All tests produce consistent results
- **Tolerance-based**: Uses relative error thresholds (typically < 1e-6 or < 1%)
- **Real-world validation**: Tests against known values (ISS, Moon, Earth parameters)
- **Clear failure messages**: Includes expected vs actual values with error percentages

**Constants Used:**
- Gravitational constant: `G = 6.67430×10⁻¹¹ m³ kg⁻¹ s⁻²`
- Earth mass: `5.972×10²⁴ kg`
- Earth radius: `6.371×10⁶ m`

### 3. Build & Test CI Workflow (`.github/workflows/build-and-test.yml`)

Automated GitHub Actions pipeline that runs on every push and pull request.

**Pipeline Steps:**

1. **Repository Checkout** with Git LFS support
2. **Environment Setup**
   - Node.js 18+
   - Rust stable toolchain (with rustfmt, clippy)
3. **Repository Sanitization** (fail-fast)
4. **Frontend Build & Test**
   - `npm ci` (if `package.json` exists)
   - ESLint (if config present)
   - Prettier (if config present)
   - `npm run build` (if script present)
5. **Rust Build & Test**
   - `cargo fmt --check`
   - `cargo clippy --all-targets --workspace -D warnings`
   - `cargo test`
6. **Physics Validation**
   - Run physics validator test suite
7. **Tauri Build** (conditional)
   - Install system dependencies
   - Build Tauri application in release mode
8. **WGSL Shader Validation** (conditional)
   - Install `naga-cli`
   - Validate all `.wgsl` shader files
9. **Artifact Upload** on failure

**Conditional Execution:**
All steps are conditional based on the presence of relevant files:
- Frontend steps run if `package.json` exists
- Rust steps run if `Cargo.toml` exists
- Tauri build runs if `src-tauri/Cargo.toml` exists
- WGSL validation runs if `.wgsl` files are found

## Physics & Astrophysics Domain

### Current Coverage

The physics validator currently covers:

- **Classical Mechanics**: Newtonian gravity, two-body problems
- **Orbital Mechanics**: Circular orbits, escape velocity, orbital periods
- **Validation Approach**: Test against real-world data (Earth, ISS, Moon, GEO)

### Future Extensions

Consider adding tests for:

- **Elliptical Orbits**: Eccentricity, apogee/perigee calculations
- **Multi-body Dynamics**: Three-body problem, Lagrange points
- **Relativistic Effects**: Time dilation, gravitational lensing (for high-precision sims)
- **Atmospheric Drag**: Orbital decay calculations
- **Radiation Pressure**: Solar sail dynamics
- **Perturbations**: J2 effects, lunar/solar perturbations
- **Optics**: Light propagation, Doppler shift, relativistic beaming

### Accuracy Requirements

- **Tolerance**: Most tests use relative error < 1% for real-world comparisons
- **Precision**: Internal consistency tests use < 1e-6 relative error
- **Units**: All calculations use SI units (meters, kilograms, seconds)

## Adding Exceptions

### Allowing Specific Files in Sanitizer

If you need to commit files that trigger sanitizer warnings/errors:

1. Add patterns to `.repo-sanitizer-ignore`:
```
# Test fixtures
test/fixtures/*.bin

# Documentation assets
docs/images/*.png
```

2. For large assets, ensure they're tracked by Git LFS in `.gitattributes`:
```
*.png filter=lfs diff=lfs merge=lfs -text
*.glb filter=lfs diff=lfs merge=lfs -text
```

### Bypassing Linting (Not Recommended)

If absolutely necessary, you can skip linting steps by:
- Removing or renaming ESLint/Prettier config files
- Using `// eslint-disable-next-line` comments for specific lines
- Using `--no-verify` with git commits (bypasses pre-commit hooks if present)

**⚠️ Warning**: Bypassing linting may lead to code quality issues and merge conflicts.

## Extending the Rule Set

### Adding New Sanitizer Rules

Edit `tools/repo-sanitizer/check.cjs`:

1. **Add new file extension checks:**
```javascript
const DISALLOWED_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'dylib', 'class', 'pyc', 'jar', 'pdb', 'o', 'obj',
  'your-new-extension'  // Add here
]);
```

2. **Add new tech stack detection:**
```javascript
function detectTechStack() {
  const stacks = {
    // ... existing
    yourTech: false
  };
  
  // Add detection logic
  if (fs.existsSync(path.join(repoRoot, 'your-config.json'))) {
    stacks.yourTech = true;
  }
  
  return stacks;
}
```

3. **Add validation rules:**
```javascript
if (stacks.yourTech && !fs.existsSync(path.join(repoRoot, 'required-file'))) {
  logWarning('Your tech detected but required-file not found');
}
```

### Adding New Physics Tests

Edit `tools/physics-validator/src/lib.rs` or add new test files:

1. **Add new physics function:**
```rust
/// Calculate [your physics formula]
pub fn your_calculation(param1: f64, param2: f64) -> f64 {
    // Your formula implementation
}
```

2. **Add validation test:**
```rust
#[test]
fn test_your_calculation() {
    let result = your_calculation(known_input1, known_input2);
    let expected = known_output;
    let error = relative_error(result, expected);
    
    assert!(
        error < TOLERANCE,
        "Test failed: got {}, expected {} (error: {:.9})",
        result, expected, error
    );
}
```

3. **Run tests:**
```bash
cargo test --manifest-path tools/physics-validator/Cargo.toml
```

### Modifying CI Workflow

Edit `.github/workflows/build-and-test.yml`:

- **Add new steps**: Insert after appropriate sections
- **Modify conditions**: Use `if:` with file existence checks
- **Add new tools**: Install via `cargo install` or `npm install -g`
- **Cache dependencies**: Use GitHub Actions cache for faster builds

Example:
```yaml
- name: Your New Check
  if: hashFiles('your-config.json') != ''
  run: your-command
  continue-on-error: false
```

## Running Full Validation Locally

Before pushing changes, run the complete validation suite:

```bash
# 1. Repository sanitization
node tools/repo-sanitizer/check.cjs

# 2. Physics validator tests
cargo test --manifest-path tools/physics-validator/Cargo.toml

# 3. Frontend build (if applicable)
npm ci
npm run build

# 4. Frontend tests (if applicable)
npm test

# 5. Rust formatting (if applicable)
cargo fmt --check

# 6. Rust linting (if applicable)
cargo clippy --all-targets --workspace -- -D warnings

# 7. Rust tests (if applicable)
cargo test --workspace
```

## Troubleshooting

### Common Issues

**Issue**: Sanitizer fails with "file larger than 1 MB not tracked by Git LFS"
- **Solution**: Add the file pattern to `.gitattributes` and re-track with `git lfs track "*.ext"`

**Issue**: Physics tests fail with small numerical differences
- **Solution**: Check if the issue is floating-point precision. Tests use tolerances, but extreme cases may need adjustment.

**Issue**: CI fails but local tests pass
- **Solution**: Ensure your local environment matches CI (Node 18+, Rust stable). Check for platform-specific issues.

**Issue**: Tauri build fails with missing dependencies
- **Solution**: Install system dependencies (see Tauri documentation for your OS)

**Issue**: WGSL validation fails
- **Solution**: Ensure shaders use valid WGSL syntax. Run `naga your-shader.wgsl` locally to debug.

### Getting Help

- **Bug Reports**: Use `.github/ISSUE_TEMPLATE/bug_report.md`
- **Feature Requests**: Use `.github/ISSUE_TEMPLATE/feature_request.md`
- **Pull Requests**: Use `.github/PULL_REQUEST_TEMPLATE.md`

## Contributing

When contributing to the agents or validators:

1. **Document changes**: Update this README
2. **Add tests**: Ensure new functionality is tested
3. **Follow conventions**: Match existing code style
4. **Test locally**: Run all validation before submitting PR
5. **Update templates**: Modify issue/PR templates if workflow changes

## References

### Physics Resources

- [Orbital Mechanics](https://en.wikipedia.org/wiki/Orbital_mechanics)
- [Kepler's Laws](https://en.wikipedia.org/wiki/Kepler%27s_laws_of_planetary_motion)
- [Two-Body Problem](https://en.wikipedia.org/wiki/Two-body_problem)
- [Escape Velocity](https://en.wikipedia.org/wiki/Escape_velocity)

### Tool Documentation

- [Git LFS](https://git-lfs.github.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Cargo](https://doc.rust-lang.org/cargo/)
- [Node.js](https://nodejs.org/)
- [Naga](https://github.com/gfx-rs/naga) - WGSL validator

## License

See repository LICENSE for details.
