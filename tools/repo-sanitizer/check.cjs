#!/usr/bin/env node
/**
 * Repository Sanitizer - Enforces code hygiene and asset management rules
 * No external dependencies - pure Node.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DISALLOWED_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'dylib', 'class', 'pyc', 'jar', 'pdb', 'o', 'obj'
]);

const LARGE_FILE_WARNING_SIZE = 50 * 1024 * 1024; // 50 MB
const LFS_REQUIRED_SIZE = 1 * 1024 * 1024; // 1 MB
const EXCLUDED_DIRS = new Set([
  '.git', 'node_modules', 'target', 'dist', 'build', '.cache', 'out'
]);

const LFS_ASSET_PATTERNS = ['*.glb', '*.gltf', '*.png', '*.jpg', '*.jpeg', '*.wav', '*.mp3', '*.ogg', '*.mp4', '*.webm'];

let errorCount = 0;
let warningCount = 0;
const repoRoot = process.cwd();

// GitHub Actions annotation helpers
function logError(message, file = null) {
  errorCount++;
  if (file) {
    console.error(`::error file=${file}::${message}`);
  } else {
    console.error(`::error::${message}`);
  }
}

function logWarning(message, file = null) {
  warningCount++;
  if (file) {
    console.log(`::warning file=${file}::${message}`);
  } else {
    console.log(`::warning::${message}`);
  }
}

// Load ignore patterns (similar to .gitignore)
function loadIgnorePatterns() {
  const ignoreFile = path.join(repoRoot, '.repo-sanitizer-ignore');
  if (!fs.existsSync(ignoreFile)) {
    return [];
  }
  
  const content = fs.readFileSync(ignoreFile, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

// Check if a path matches any ignore pattern
function isIgnored(filePath, ignorePatterns) {
  const relativePath = path.relative(repoRoot, filePath);
  
  // Check excluded directories
  const pathParts = relativePath.split(path.sep);
  for (const part of pathParts) {
    if (EXCLUDED_DIRS.has(part)) {
      return true;
    }
  }
  
  // Check custom ignore patterns
  for (const pattern of ignorePatterns) {
    if (pattern.includes('*')) {
      // Simple glob pattern matching
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

// Check if file contains NULL bytes (probable binary)
function isProbablyBinary(filePath) {
  try {
    const buffer = Buffer.alloc(8192);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 8192, 0);
    fs.closeSync(fd);
    
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
}

// Load .gitattributes patterns
function loadGitAttributesPatterns() {
  const gitattributesPath = path.join(repoRoot, '.gitattributes');
  if (!fs.existsSync(gitattributesPath)) {
    return [];
  }
  
  const content = fs.readFileSync(gitattributesPath, 'utf8');
  const patterns = [];
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('filter=lfs')) {
      const match = trimmed.match(/^([^\s]+)/);
      if (match) {
        patterns.push(match[1]);
      }
    }
  }
  
  return patterns;
}

// Check if file matches LFS pattern
function matchesLfsPattern(filePath, lfsPatterns) {
  const relativePath = path.relative(repoRoot, filePath);
  
  for (const pattern of lfsPatterns) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$');
      if (regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath === pattern) {
      return true;
    }
  }
  
  return false;
}

// Recursively scan directory
function scanDirectory(dirPath, ignorePatterns, lfsPatterns, largeFiles, issues) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    return;
  }
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (isIgnored(fullPath, ignorePatterns)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, ignorePatterns, lfsPatterns, largeFiles, issues);
    } else if (entry.isFile()) {
      const relativePath = path.relative(repoRoot, fullPath);
      const ext = path.extname(entry.name).slice(1).toLowerCase();
      
      // Check disallowed extensions
      if (DISALLOWED_EXTENSIONS.has(ext)) {
        issues.push({
          type: 'disallowed_extension',
          file: relativePath,
          message: `Disallowed compiled/binary file extension: .${ext}. Remove this file or add to .repo-sanitizer-ignore if required.`
        });
      }
      
      // Get file size
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (err) {
        continue;
      }
      
      const fileSize = stats.size;
      
      // Check large files
      if (fileSize > LARGE_FILE_WARNING_SIZE) {
        issues.push({
          type: 'large_file',
          file: relativePath,
          message: `File exceeds 50 MB (${(fileSize / 1024 / 1024).toFixed(2)} MB). Consider compressing or removing.`
        });
      }
      
      // Check LFS requirement
      if (fileSize > LFS_REQUIRED_SIZE) {
        if (!matchesLfsPattern(fullPath, lfsPatterns)) {
          largeFiles.push({
            path: relativePath,
            size: fileSize,
            ext: ext
          });
        }
      }
      
      // Check for binary files by NULL bytes
      if (fileSize > 0 && fileSize < 10 * 1024 * 1024) { // Only check files < 10MB for performance
        if (!DISALLOWED_EXTENSIONS.has(ext) && isProbablyBinary(fullPath)) {
          const knownBinaryExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'mp3', 'wav', 'ogg', 'mp4', 'webm', 'glb', 'gltf', 'bin']);
          if (!knownBinaryExts.has(ext)) {
            issues.push({
              type: 'binary_file',
              file: relativePath,
              message: `File contains NULL bytes but has text extension .${ext}. Ensure proper file type or add to .repo-sanitizer-ignore.`
            });
          }
        }
      }
    }
  }
}

// Detect tech stacks
function detectTechStack() {
  const stacks = {
    typescript: false,
    react: false,
    rust: false,
    electron: false,
    tauri: false,
    babylonjs: null,
    webgpu: false,
    webgl2: false
  };
  
  // Check package.json
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
      };
      
      if (allDeps['typescript'] || allDeps['@types/node']) {
        stacks.typescript = true;
      }
      
      if (allDeps['react']) {
        stacks.react = true;
      }
      
      if (allDeps['electron']) {
        stacks.electron = true;
      }
      
      if (allDeps['@tauri-apps/api'] || allDeps['@tauri-apps/cli']) {
        stacks.tauri = true;
      }
      
      // Check Babylon.js version
      for (const dep in allDeps) {
        if (dep.includes('babylonjs') || dep === '@babylonjs/core') {
          const version = allDeps[dep];
          const versionMatch = version.match(/(\d+)\./);
          if (versionMatch) {
            const majorVersion = parseInt(versionMatch[1]);
            stacks.babylonjs = majorVersion;
          } else {
            stacks.babylonjs = 0; // Use 0 for unknown version to maintain type consistency
          }
        }
      }
    } catch (err) {
      // Ignore JSON parse errors
    }
  }
  
  // Check tsconfig.json
  if (fs.existsSync(path.join(repoRoot, 'tsconfig.json'))) {
    stacks.typescript = true;
  }
  
  // Check Cargo.toml
  if (fs.existsSync(path.join(repoRoot, 'Cargo.toml')) || 
      fs.existsSync(path.join(repoRoot, 'src-tauri', 'Cargo.toml'))) {
    stacks.rust = true;
  }
  
  // Check for Tauri
  if (fs.existsSync(path.join(repoRoot, 'src-tauri'))) {
    stacks.tauri = true;
  }
  
  // Scan for WebGPU/WebGL2 usage in source files
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx'];
  function scanForGraphicsAPI(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && !EXCLUDED_DIRS.has(entry.name)) {
        scanForGraphicsAPI(fullPath);
      } else if (entry.isFile() && sourceExts.includes(path.extname(entry.name))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('navigator.gpu') || 
              content.includes('GPUDevice') || 
              content.includes('"webgpu"') ||
              content.includes('requestAdapter')) {
            stacks.webgpu = true;
          }
          if (content.includes('getContext("webgl2")') || 
              content.includes("getContext('webgl2')")) {
            stacks.webgl2 = true;
          }
        } catch (err) {
          // Ignore read errors
        }
      }
    }
  }
  
  scanForGraphicsAPI(repoRoot);
  
  return stacks;
}

// Main execution
function main() {
  console.log('🔍 Running repository sanitizer...\n');
  
  const ignorePatterns = loadIgnorePatterns();
  const lfsPatterns = loadGitAttributesPatterns();
  const largeFiles = [];
  const issues = [];
  
  // Scan repository
  scanDirectory(repoRoot, ignorePatterns, lfsPatterns, largeFiles, issues);
  
  // Report issues
  for (const issue of issues) {
    if (issue.type === 'disallowed_extension' || issue.type === 'binary_file') {
      logError(issue.message, issue.file);
    } else {
      logWarning(issue.message, issue.file);
    }
  }
  
  // Check LFS configuration for large files
  if (largeFiles.length > 0) {
    const missingPatterns = new Set();
    const extCounts = {};
    
    for (const file of largeFiles) {
      extCounts[file.ext] = (extCounts[file.ext] || 0) + 1;
    }
    
    console.log('\n❌ Large files not tracked by Git LFS:');
    for (const file of largeFiles) {
      console.log(`   ${file.path} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      missingPatterns.add(`*.${file.ext}`);
    }
    
    logError(
      `Found ${largeFiles.length} file(s) larger than 1 MB not tracked by Git LFS. ` +
      `Add these patterns to .gitattributes: ${Array.from(missingPatterns).join(' ')} filter=lfs diff=lfs merge=lfs -text`
    );
  }

  // Detect and validate tech stacks
  console.log('\n📦 Detected tech stacks:');
  const stacks = detectTechStack();

  if (stacks.typescript) console.log('   ✓ TypeScript');
  if (stacks.react) console.log('   ✓ React');
  if (stacks.rust) console.log('   ✓ Rust');
  if (stacks.electron) console.log('   ✓ Electron');
  if (stacks.tauri) console.log('   ✓ Tauri');
  if (stacks.babylonjs) {
    const versionStr = stacks.babylonjs === 0 ? 'unknown' : stacks.babylonjs;
    console.log(`   ✓ Babylon.js (version ${versionStr})`);
  }
  if (stacks.webgpu) console.log('   ✓ WebGPU usage detected');
  if (stacks.webgl2) console.log('   ✓ WebGL2 usage detected');

  // Validate Babylon.js version
  if (stacks.babylonjs && stacks.babylonjs > 0 && stacks.babylonjs < 7) {
    logWarning(`Babylon.js version ${stacks.babylonjs} detected. Consider upgrading to version 7+ for latest features.`);
  }

  // Check for missing configurations
  const escalateToError = process.env.SANITIZER_STRICT === 'true';
  
  if (stacks.typescript && !fs.existsSync(path.join(repoRoot, 'tsconfig.json'))) {
    const msg = 'TypeScript detected but tsconfig.json not found';
    escalateToError ? logError(msg) : logWarning(msg);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${errorCount} error(s), ${warningCount} warning(s)`);
  console.log('='.repeat(60));
  
  if (errorCount > 0) {
    console.log('\n❌ Repository sanitization failed!');
    console.log('Please fix the errors above before committing.\n');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('\n⚠️  Repository sanitization passed with warnings.');
    console.log('Consider addressing the warnings above.\n');
    process.exit(0);
  } else {
    console.log('\n✅ Repository sanitization passed!\n');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
