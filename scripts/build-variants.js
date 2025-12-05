/**
 * Build variants script for n8n-nodes-robolly
 * 
 * Creates two package versions:
 * - cloud: n8n Cloud compatible (no FFmpeg, no fs/os/path) - DEFAULT
 * - full: All features including local FFmpeg conversion
 * 
 * Usage:
 *   node scripts/build-variants.js cloud   # Build cloud version (default)
 *   node scripts/build-variants.js full    # Build full version with FFmpeg
 *   node scripts/build-variants.js both    # Build both variants
 * 
 * Structure:
 *   .build-full/                # Full version source files (tracked in git)
 *     ├── ffmpegMethods.ts
 *     ├── sharpMethods.ts
 *     ├── utils.ts
 *     ├── methods.full.ts       # Methods with FFmpeg imports
 *     ├── fields.full.ts        # Fields with conversion UI
 *     └── extentionConvetor.full.ts
 *   
 *   nodes/Robolly/              # Cloud version (default)
 *     ├── methods.ts            # Cloud-compatible
 *     ├── fields.ts             # No conversion options
 *     └── extentionConvetor.ts  # Minimal version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NODES_DIR = path.join(ROOT, 'nodes', 'Robolly');
const DIST_DIR = path.join(ROOT, 'dist');
const FULL_SRC_DIR = path.join(ROOT, '.build-full');

// Files specific to full version (FFmpeg features)
const FULL_ONLY_FILES = [
  'ffmpegMethods.ts',
  'sharpMethods.ts', 
  'utils.ts',
];

// Files that have different versions
const VARIANT_FILES = [
  { cloud: 'methods.ts', full: 'methods.full.ts' },
  { cloud: 'fields.ts', full: 'fields.full.ts' },
  { cloud: 'extentionConvetor.ts', full: 'extentionConvetor.full.ts' },
];

const variant = process.argv[2] || 'cloud';

async function main() {
  console.log(`\n🔧 Build Variants Script\n`);

  if (variant === 'both') {
    await buildVariant('cloud');
    await buildVariant('full');
    console.log('\n✅ Both variants built successfully!');
    console.log('   dist/         → Cloud version (n8n Cloud compatible)');
    console.log('   dist-full/    → Full version (self-hosted only, requires FFmpeg)');
    return;
  }

  if (variant === 'status') {
    await showStatus();
    return;
  }

  await buildVariant(variant);
}

async function showStatus() {
  console.log('📋 Build Variants Status\n');
  
  console.log('Full version source files (.build-full/):');
  for (const file of [...FULL_ONLY_FILES, ...VARIANT_FILES.map(v => v.full)]) {
    const exists = fs.existsSync(path.join(FULL_SRC_DIR, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  }
  
  console.log('\nCloud version (nodes/Robolly/):');
  for (const file of VARIANT_FILES.map(v => v.cloud)) {
    const exists = fs.existsSync(path.join(NODES_DIR, file));
    console.log(`   ${exists ? '✅' : '✅'} ${file}`);
  }
  
  console.log('\nTo set up full version files, copy the original FFmpeg-enabled');
  console.log('files to .build-full/ directory. See .build-full/README.md');
}

async function buildVariant(type) {
  console.log(`\n📦 Building ${type} variant...`);

  const outputDir = type === 'full' ? path.join(ROOT, 'dist-full') : DIST_DIR;

  // Clean output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }

  if (type === 'full') {
    // Check if full version files exist
    const missingFiles = checkFullFilesExist();
    if (missingFiles.length > 0) {
      console.error('\n❌ Missing full version source files in .build-full/:');
      missingFiles.forEach(f => console.error(`   - ${f}`));
      console.error('\nPlease add the FFmpeg-enabled source files to .build-full/');
      console.error('See .build-full/README.md for details.');
      process.exit(1);
    }

    // Copy full version files to nodes/Robolly/
    await setupFullVariant();
  }

  // Run TypeScript build
  try {
    if (type === 'full') {
      // Build to dist-full
      execSync(`npx tsc --outDir "${outputDir}"`, { 
        cwd: ROOT, 
        stdio: 'inherit' 
      });
    } else {
      // Normal build
      execSync('npx rimraf dist && npx tsc', { 
        cwd: ROOT, 
        stdio: 'inherit' 
      });
    }
    
    // Copy icons
    execSync('npx gulp build:icons', { 
      cwd: ROOT, 
      stdio: 'inherit' 
    });

    // For full build, copy icons to dist-full
    if (type === 'full') {
      copyIcons(DIST_DIR, outputDir);
    }

    console.log(`\n✅ ${type.toUpperCase()} variant built to ${path.relative(ROOT, outputDir)}/`);
    
    if (type === 'full') {
      console.log('\n⚠️  Note: This version requires FFmpeg installed on the system.');
      console.log('   Not compatible with n8n Cloud!');
    }
  } catch (error) {
    console.error(`\n❌ Build failed for ${type} variant:`, error.message);
    process.exit(1);
  } finally {
    // Always restore cloud version after full build
    if (type === 'full') {
      await restoreCloudVariant();
    }
  }
}

function checkFullFilesExist() {
  const missing = [];
  
  for (const file of FULL_ONLY_FILES) {
    if (!fs.existsSync(path.join(FULL_SRC_DIR, file))) {
      missing.push(file);
    }
  }
  
  for (const variant of VARIANT_FILES) {
    if (!fs.existsSync(path.join(FULL_SRC_DIR, variant.full))) {
      missing.push(variant.full);
    }
  }
  
  return missing;
}

async function setupFullVariant() {
  console.log('   Copying full version files...');
  
  // Copy FFmpeg-specific files
  for (const file of FULL_ONLY_FILES) {
    const src = path.join(FULL_SRC_DIR, file);
    const dest = path.join(NODES_DIR, file);
    fs.copyFileSync(src, dest);
    console.log(`   + ${file}`);
  }
  
  // Swap variant files
  for (const variant of VARIANT_FILES) {
    const src = path.join(FULL_SRC_DIR, variant.full);
    const dest = path.join(NODES_DIR, variant.cloud);
    
    // Backup cloud version
    const backup = path.join(NODES_DIR, `${variant.cloud}.cloud-backup`);
    if (fs.existsSync(dest)) {
      fs.copyFileSync(dest, backup);
    }
    
    // Copy full version
    fs.copyFileSync(src, dest);
    console.log(`   ~ ${variant.cloud} (full version)`);
  }
}

async function restoreCloudVariant() {
  console.log('\n   Restoring cloud version...');
  
  // Remove FFmpeg-specific files
  for (const file of FULL_ONLY_FILES) {
    const filePath = path.join(NODES_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  // Restore cloud variant files
  for (const variant of VARIANT_FILES) {
    const backup = path.join(NODES_DIR, `${variant.cloud}.cloud-backup`);
    const dest = path.join(NODES_DIR, variant.cloud);
    
    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, dest);
      fs.unlinkSync(backup);
    }
  }
  
  console.log('   ✅ Cloud version restored');
}

function copyIcons(srcDist, destDist) {
  const srcNodes = path.join(srcDist, 'nodes');
  const destNodes = path.join(destDist, 'nodes');
  
  if (fs.existsSync(srcNodes)) {
    copyDir(srcNodes, destNodes);
  }
  
  const srcCreds = path.join(srcDist, 'credentials');
  const destCreds = path.join(destDist, 'credentials');
  
  if (fs.existsSync(srcCreds)) {
    copyDir(srcCreds, destCreds);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.name.endsWith('.svg') || entry.name.endsWith('.png')) {
      // Only copy icon files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

main().catch(console.error);
