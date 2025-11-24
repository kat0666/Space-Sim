#!/usr/bin/env node

/**
 * Repository Sanitizer
 * 
 * A standalone Node.js script (no external dependencies) that enforces
 * repository hygiene rules and tech stack requirements for the Space Simulator project.
 * 
 * Usage: node tools/repo-sanitizer/check.js
 * Exit codes: 0 = success, 1 = errors found
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5 MB in bytes
  disallowedExtensions: ['.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.jar', '.pdb', '.o', '.obj'],
  excludeDirs: ['.git', 'node_modules', 'target', 'dist', 'build', 'dist-ssr', '.vscode', '.idea'],
  requiredTechStack: {
    typescript: { files: ['tsconfig.json'], dependencies: ['typescript'] },
    react: { dependencies: ['react'] },
    babylonjs: { minVersion: 7, cdnPattern: /babylonjs\.com/, dependencies: ['@babylonjs/core'] },
    webgpu: { codePatterns: ['navigator.gpu', 'WebGPUEngine', 'GPUDevice'] },
    webgl2: { codePatterns: ['getContext("webgl2")', "getContext('webgl2')"] },
  }
};

// Error and warning tracking
const errors = [];
const warnings = [];

/**
 * Logs a message to console with GitHub Actions annotations
 */
function log(level, message, file = null, line = null) {
  const prefix = level === 'error' ? '::error' : level === 'warning' ? '::warning' : '::notice';
  const location = file ? ` file=${file}${line ? `,line=${line}` : ''}` : '';
  console.log(`${prefix}${location}::${message}`);
}

/**
 * Recursively walks directory and returns all file paths
 */
function* walkDir(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    // Skip excluded directories
    if (entry.isDirectory()) {
      if (CONFIG.excludeDirs.includes(entry.name)) {
        continue;
      }
      yield* walkDir(fullPath, baseDir);
    } else if (entry.isFile()) {
      yield { fullPath, relativePath, name: entry.name };
    }
  }
}

/**
 * Checks if file has a disallowed extension
 */
function checkDisallowedExtensions(file) {
  const ext = path.extname(file.name).toLowerCase();
  if (CONFIG.disallowedExtensions.includes(ext)) {
    errors.push(`Disallowed binary file detected: ${file.relativePath}`);
    log('error', `Binary file with extension ${ext} is not allowed`, file.relativePath);
    return false;
  }
  return true;
}

/**
 * Checks if file exceeds maximum size
 */
function checkFileSize(file) {
  try {
    const stats = fs.statSync(file.fullPath);
    if (stats.size > CONFIG.maxFileSize) {
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const maxMB = (CONFIG.maxFileSize / (1024 * 1024)).toFixed(2);
      errors.push(`File too large: ${file.relativePath} (${sizeMB} MB > ${maxMB} MB)`);
      log('error', `File exceeds maximum size of ${maxMB} MB (${sizeMB} MB)`, file.relativePath);
      return false;
    }
  } catch (err) {
    warnings.push(`Could not check size of ${file.relativePath}: ${err.message}`);
  }
  return true;
}

/**
 * Checks if file appears to be binary by looking for NULL bytes
 */
function checkBinaryContent(file) {
  try {
    // Skip files that are known to be binary but allowed
    const allowedBinaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.svg'];
    const ext = path.extname(file.name).toLowerCase();
    if (allowedBinaryExts.includes(ext)) {
      return true;
    }
    
    // Read first 8KB to check for NULL bytes
    const buffer = Buffer.alloc(8192);
    const fd = fs.openSync(file.fullPath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 8192, 0);
    fs.closeSync(fd);
    
    // Check for NULL bytes
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        errors.push(`Probable binary file detected: ${file.relativePath}`);
        log('error', 'File appears to be binary (contains NULL bytes)', file.relativePath);
        return false;
      }
    }
  } catch (err) {
    // If we can't read it, assume it's okay and skip
    if (err.code !== 'EISDIR') {
      warnings.push(`Could not check binary content of ${file.relativePath}: ${err.message}`);
    }
  }
  return true;
}

/**
 * Checks if TypeScript is properly configured
 */
function checkTypeScript() {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  let hasTsConfig = fs.existsSync(tsconfigPath);
  let hasTypeScriptDep = false;
  
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    hasTypeScriptDep = !!(pkg.dependencies?.typescript || pkg.devDependencies?.typescript);
  }
  
  if (hasTsConfig && !hasTypeScriptDep) {
    warnings.push('TypeScript config found but typescript is not in dependencies');
    log('warning', 'tsconfig.json found but typescript is not in package.json dependencies', 'package.json');
  }
  
  return hasTsConfig || hasTypeScriptDep;
}

/**
 * Checks if React is properly configured
 */
function checkReact() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasReact = !!(pkg.dependencies?.react || pkg.devDependencies?.react);
    
    if (!hasReact) {
      warnings.push('React not found in package.json but project appears to use React');
      log('warning', 'React components found but react is not in package.json', 'package.json');
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Checks for Babylon.js usage and version
 */
function checkBabylonJS() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let hasBabylonDep = false;
  let babylonVersion = null;
  
  // Check package.json for Babylon dependency
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    for (const [name, version] of Object.entries(allDeps)) {
      if (name.includes('babylon')) {
        hasBabylonDep = true;
        // Extract version number
        const match = version.match(/(\d+)\./);
        if (match) {
          babylonVersion = parseInt(match[1]);
        }
      }
    }
  }
  
  // Check HTML files for CDN usage
  let hasCDNUsage = false;
  const htmlFiles = ['index.html', 'public/index.html'];
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(process.cwd(), htmlFile);
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      if (CONFIG.requiredTechStack.babylonjs.cdnPattern.test(content)) {
        hasCDNUsage = true;
        // CDN versions are typically latest, assume modern version
        log('notice', 'Babylon.js loaded via CDN detected', htmlFile);
      }
    }
  }
  
  // Check code for Babylon usage
  let hasBabylonCode = false;
  try {
    for (const file of walkDir(process.cwd())) {
      if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        if (content.includes('BABYLON') || content.includes('babylon')) {
          hasBabylonCode = true;
          break;
        }
      }
    }
  } catch (err) {
    // Ignore errors in file scanning
  }
  
  if (hasBabylonCode && !hasBabylonDep && !hasCDNUsage) {
    warnings.push('Babylon.js code detected but no dependency or CDN usage found');
    log('warning', 'Babylon.js usage detected in code but not properly configured', 'package.json');
    return false;
  }
  
  if (hasBabylonDep && babylonVersion && babylonVersion < CONFIG.requiredTechStack.babylonjs.minVersion) {
    warnings.push(`Babylon.js version ${babylonVersion} is below recommended minimum version ${CONFIG.requiredTechStack.babylonjs.minVersion}`);
    log('warning', `Babylon.js version should be >= ${CONFIG.requiredTechStack.babylonjs.minVersion}`, 'package.json');
    return false;
  }
  
  return hasBabylonDep || hasCDNUsage || !hasBabylonCode;
}

/**
 * Checks for WebGPU usage in code
 */
function checkWebGPU() {
  let hasWebGPUCode = false;
  
  try {
    for (const file of walkDir(process.cwd())) {
      if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        for (const pattern of CONFIG.requiredTechStack.webgpu.codePatterns) {
          if (content.includes(pattern)) {
            hasWebGPUCode = true;
            log('notice', `WebGPU usage detected: ${pattern}`, file.relativePath);
            break;
          }
        }
        if (hasWebGPUCode) break;
      }
    }
  } catch (err) {
    // Ignore errors in file scanning
  }
  
  if (!hasWebGPUCode) {
    warnings.push('No WebGPU usage detected - space simulator should use WebGPU for rendering');
    log('warning', 'WebGPU usage not detected in codebase', 'components/');
  }
  
  return hasWebGPUCode;
}

/**
 * Checks for WebGL2 fallback usage
 */
function checkWebGL2() {
  let hasWebGL2Code = false;
  
  try {
    for (const file of walkDir(process.cwd())) {
      if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        for (const pattern of CONFIG.requiredTechStack.webgl2.codePatterns) {
          if (content.includes(pattern)) {
            hasWebGL2Code = true;
            log('notice', 'WebGL2 fallback detected', file.relativePath);
            break;
          }
        }
        if (hasWebGL2Code) break;
      }
    }
  } catch (err) {
    // Ignore errors in file scanning
  }
  
  return hasWebGL2Code;
}

/**
 * Main execution
 */
function main() {
  console.log('=== Repository Sanitizer ===');
  console.log('Checking repository hygiene and tech stack requirements...\n');
  
  const startTime = Date.now();
  let filesChecked = 0;
  
  // Check all files for hygiene issues
  console.log('Scanning files for hygiene issues...');
  try {
    for (const file of walkDir(process.cwd())) {
      filesChecked++;
      checkDisallowedExtensions(file);
      checkFileSize(file);
      checkBinaryContent(file);
    }
  } catch (err) {
    errors.push(`Error scanning files: ${err.message}`);
    log('error', `Failed to scan repository: ${err.message}`);
  }
  
  console.log(`Scanned ${filesChecked} files\n`);
  
  // Check tech stack requirements
  console.log('Checking tech stack requirements...');
  checkTypeScript();
  checkReact();
  checkBabylonJS();
  const hasWebGPU = checkWebGPU();
  const hasWebGL2 = checkWebGL2();
  
  // Domain-specific checks for space simulator
  if (!hasWebGPU && !hasWebGL2) {
    warnings.push('Space simulator should use WebGPU or WebGL2 for 3D rendering');
    log('warning', 'Neither WebGPU nor WebGL2 detected - space simulator requires 3D rendering', '');
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Report results
  console.log('\n=== Results ===');
  console.log(`Time: ${elapsed}s`);
  console.log(`Files checked: ${filesChecked}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All checks passed!');
    return 0;
  } else if (errors.length === 0) {
    console.log('\n✅ No critical errors found (warnings present)');
    return 0;
  } else {
    console.log('\n❌ Critical errors found - please fix before committing');
    return 1;
  }
}

// Execute if run directly
if (require.main === module) {
  process.exit(main());
}

module.exports = { main };
