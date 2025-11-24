---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description
<!-- A clear and concise description of what the bug is -->

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
<!-- A clear and concise description of what you expected to happen -->

## Actual Behavior
<!-- A clear and concise description of what actually happened -->

## Screenshots/Videos
<!-- If applicable, add screenshots or videos to help explain your problem -->

## Environment
**Desktop:**
 - OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
 - Browser: [e.g., Chrome 120, Firefox 121]
 - Version: [e.g., 1.0.0]

**Physics/Simulation Context:**
 - Affected simulation type: [e.g., orbital mechanics, gravitational fields]
 - Number of bodies in simulation: [e.g., 3]
 - Timescale: [e.g., 1x, 10x]

## Build & Test Status
<!-- Run these commands and paste the output -->

<details>
<summary>Repository Sanitizer Output</summary>

```bash
node tools/repo-sanitizer/check.cjs
# Paste output here
```

</details>

<details>
<summary>Physics Validator Output</summary>

```bash
cargo test --manifest-path tools/physics-validator/Cargo.toml
# Paste output here
```

</details>

## Additional Context
<!-- Add any other context about the problem here -->

## Possible Solution
<!-- If you have suggestions on how to fix the bug, please describe them here -->
