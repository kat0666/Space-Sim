# Repository Sanitation Agents

This document describes the automated agents and checks that maintain repository hygiene and enforce technical standards for the Space Simulator project.

## Overview

The Space Simulator uses automated "agents" (scripts and GitHub Actions workflows) to ensure code quality, prevent common mistakes, and validate that the project adheres to its technical stack requirements.

## What Gets Checked

### 1. Repository Hygiene

The repository sanitizer (`tools/repo-sanitizer/check.cjs`) enforces the following rules:

#### Disallowed File Types
- **Binary executables**: `.exe`, `.dll`, `.so`, `.dylib`
- **Compiled code**: `.class`, `.pyc`, `.jar`, `.pdb`, `.o`, `.obj`

These files should never be committed to the repository. Build artifacts belong in `.gitignore`.

#### File Size Limits
- Files larger than **5 MB** are not allowed
- This prevents repository bloat and ensures fast clones
- Exceptions can be made for essential assets (contact maintainers)

#### Binary Content Detection
- Files are scanned for NULL bytes to detect binary content
- Allowed binary types: images (`.png`, `.jpg`, `.svg`), fonts (`.woff`, `.ttf`)
- Unrecognized binary files trigger errors

### 2. Tech Stack Validation

The agents verify that the project's core technologies are properly configured:

#### TypeScript
- Validates presence of `tsconfig.json`
- Checks that `typescript` is in dependencies
- Ensures type safety is maintained

#### React
- Validates `react` is in `package.json` dependencies
- Confirms React components are properly configured
- Checks for React ≥19 (current requirement)

#### Babylon.js
- Verifies Babylon.js usage (via npm dependency or CDN)
- **Minimum version requirement: Babylon.js 7.x**
- Checks for proper initialization in code
- Validates physics engine integration (Havok)

#### WebGPU and WebGL2
- **Primary**: WebGPU support for modern hardware
- **Fallback**: WebGL2 for compatibility
- Scans code for:
  - `navigator.gpu` - WebGPU detection
  - `WebGPUEngine` - Babylon.js WebGPU engine
  - `getContext('webgl2')` - WebGL2 fallback
  - `GPUDevice` - WebGPU device API

### 3. Domain-Specific Expectations

As a **space/physics simulator**, the project should demonstrate:

#### Physics & Astrophysics
- Gravitational N-body dynamics
- Orbital mechanics (elliptical, parabolic, hyperbolic orbits)
- Support for exotic scenarios (binary stars, black holes, neutron stars)
- Physical constants and units
- Time scaling for visualization

#### Rendering & Optics
- 3D visualization using WebGPU/WebGL2
- Real-time physics simulation
- Trail rendering for orbital paths
- Glow effects for stellar bodies
- Camera controls (pan, zoom, rotate)

#### Scientific Accuracy (Future Goals)
- Relativistic effects (gravitational lensing, time dilation)
- Quantum effects for exotic matter
- Electromagnetic interactions
- Radiation pressure
- N-body problem numerical integration methods

## Running Checks Locally

### Quick Check
Run the sanitizer before committing:

```bash
node tools/repo-sanitizer/check.cjs
```

### Full Validation
To run all checks that CI will perform:

```bash
# Install dependencies
npm install

# Run linter (if configured)
npm run lint || npx eslint . --ext .js,.jsx,.ts,.tsx

# Run formatter check (if configured)
npx prettier --check .

# Run sanitizer
node tools/repo-sanitizer/check.cjs

# Build the project
npm run build
```

## Continuous Integration

The GitHub Actions workflow (`.github/workflows/repo-sanity.yml`) runs automatically on:
- Every push to `main`, `develop`, or `copilot/**` branches
- Every pull request to `main` or `develop`

### Workflow Steps

1. **Checkout code**: Get the latest repository state
2. **Setup Node.js**: Install Node.js 20 with npm caching
3. **Conditional checks**: Detect what's available in the repo
   - Check for `package.json` → run npm checks
   - Check for `Cargo.toml` → run Rust checks
4. **Linting/Formatting**:
   - ESLint (if installed)
   - Prettier (if installed)
   - `cargo fmt` (if Rust present)
   - `cargo clippy` (if Rust present)
5. **Repository sanitizer**: Run hygiene checks (required, fails on errors)
6. **Summary**: Generate workflow summary

### Workflow Behavior

- **Linters/formatters**: Run if available, continue on error (warnings only)
- **Sanitizer**: Always runs, **fails workflow if errors found**
- **Missing tools**: Gracefully skipped if not configured

## Extending the Rules

### Adding New Checks

To add custom validation rules, edit `tools/repo-sanitizer/check.cjs`:

```javascript
// Example: Add check for Python files
function checkPython() {
  const hasPythonFiles = /* scan for .py files */;
  if (hasPythonFiles) {
    warnings.push('Python files detected but no requirements.txt found');
    return false;
  }
  return true;
}

// Add to main() function
checkPython();
```

### Whitelisting Exceptions

If you need to allow specific files that normally would be blocked:

```javascript
// In check.cjs, modify the exclusion logic
const CONFIG = {
  // ...
  allowedLargeFiles: ['data/star-catalog.json'],
  allowedBinaries: ['tools/legacy/converter.exe']
};
```

### Adjusting Thresholds

Edit the configuration at the top of `check.cjs`:

```javascript
const CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // Increase to 10 MB
  disallowedExtensions: ['.exe', '.dll'], // Remove some extensions
  // ...
};
```

## Troubleshooting

### Sanitizer Fails on My Machine

1. **Check Node version**: Requires Node.js 14+
   ```bash
   node --version
   ```

2. **Ensure clean working directory**:
   ```bash
   git status
   ```

3. **Check for uncommitted binaries**:
   ```bash
   git ls-files --others --exclude-standard
   ```

### False Positives

If the sanitizer incorrectly flags a file:

1. Check if it's a legitimate concern (binary data in source?)
2. If it's a false positive, open an issue with details
3. Temporary workaround: exclude in `.gitignore` and document why

### CI Workflow Fails

1. **Check the Actions tab** on GitHub for detailed logs
2. **Review the sanitizer output** for specific errors
3. **Run locally first** to catch issues before pushing
4. **Look for GitHub Actions annotations** in the PR diff view

## Maintenance

### Regular Tasks

- **Weekly**: Review Dependabot PRs for dependency updates
- **Monthly**: Update sanitizer rules based on project evolution
- **Quarterly**: Review excluded directories and allowed file types

### Updating Dependencies

The project uses Dependabot to keep dependencies updated:
- **npm packages**: Checked weekly
- **cargo crates**: Checked weekly (if applicable)
- **GitHub Actions**: Checked weekly

Review and merge Dependabot PRs promptly to stay secure and up-to-date.

### Modifying Workflow

To change GitHub Actions behavior, edit `.github/workflows/repo-sanity.yml`:

```yaml
# Example: Change trigger branches
on:
  push:
    branches: [ "main", "develop", "feature/**" ]
```

## Related Files

- **Workflow**: `.github/workflows/repo-sanity.yml`
- **Sanitizer**: `tools/repo-sanitizer/check.cjs`
- **CODEOWNERS**: `.github/CODEOWNERS`
- **PR Template**: `.github/PULL_REQUEST_TEMPLATE.md`
- **Issue Templates**: `.github/ISSUE_TEMPLATE/`
- **Dependabot**: `.github/dependabot.yml`

## Getting Help

If you encounter issues with the automated checks:

1. Read the error messages carefully - they're designed to be actionable
2. Check this documentation for guidance
3. Run checks locally to reproduce the issue
4. Open an issue with the `build-tools` label
5. Contact @kat0666 for urgent problems

## Philosophy

These agents exist to:
- **Prevent mistakes** before they reach production
- **Maintain consistency** across the codebase
- **Enforce standards** without manual review overhead
- **Document expectations** through automated checks
- **Enable collaboration** with clear guidelines

They're not meant to be obstacles - if a rule doesn't make sense for your use case, let's discuss changing it!

## Future Enhancements

Planned improvements to the automation:

- [ ] Physics correctness validation (unit tests for N-body solver)
- [ ] Performance regression detection (benchmark suite)
- [ ] Visual regression testing (screenshot comparisons)
- [ ] Security scanning (dependency vulnerabilities)
- [ ] License compliance checking
- [ ] Documentation coverage metrics
- [ ] API breaking change detection

---

**Last updated**: 2025-11-24  
**Maintainer**: @kat0666  
**License**: Same as repository
