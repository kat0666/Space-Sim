## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Other (please describe):

## Testing
<!-- Describe the tests you ran and how to reproduce them -->
- [ ] I have tested these changes locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] All existing tests pass with my changes

## Pre-Submission Checklist
<!-- Ensure you've completed these steps before submitting the PR -->
- [ ] I have run the repository sanitizer locally: `node tools/repo-sanitizer/check.cjs`
- [ ] No binaries, compiled files, or files >5MB have been added
- [ ] My code follows the existing code style of this project
- [ ] I have updated the documentation (if applicable)
- [ ] My changes generate no new warnings or errors

## Automated Checks
This repository uses automated agents to enforce:
- ✅ No binary files (`.exe`, `.dll`, `.so`, `.class`, `.pyc`, etc.)
- ✅ No files larger than 5 MB
- ✅ Tech stack validation (TypeScript, React, Babylon.js ≥7, WebGPU/WebGL2)
- ✅ Code quality (ESLint, Prettier, cargo fmt/clippy if applicable)

The GitHub Actions workflow will automatically run these checks when you open this PR.

## Related Issues
<!-- Link any related issues using #issue_number -->
Closes #

## Additional Context
<!-- Add any other context, screenshots, or information about the PR here -->
