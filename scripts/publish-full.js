/**
 * Publish the "full" version of the package with FFmpeg features
 * 
 * This script:
 * 1. Builds the full variant
 * 2. Temporarily swaps dist with dist-full
 * 3. Publishes with the "full" tag
 * 4. Restores the original dist
 * 
 * Usage:
 *   pnpm run publish:full
 * 
 * Install command for users:
 *   npm install @nskha/n8n-nodes-robolly@full
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_FULL_DIR = path.join(ROOT, 'dist-full');
const DIST_BACKUP_DIR = path.join(ROOT, 'dist-cloud-backup');

async function main() {
  console.log('\n📦 Publishing full version with FFmpeg features...\n');

  // Step 1: Build full variant
  console.log('1️⃣  Building full variant...');
  try {
    execSync('node scripts/build-variants.js full', { cwd: ROOT, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to build full variant');
    process.exit(1);
  }

  // Check if dist-full exists
  if (!fs.existsSync(DIST_FULL_DIR)) {
    console.error('❌ dist-full directory not found. Build may have failed.');
    process.exit(1);
  }

  // Step 2: Backup current dist (cloud version)
  console.log('\n2️⃣  Backing up cloud dist...');
  if (fs.existsSync(DIST_DIR)) {
    if (fs.existsSync(DIST_BACKUP_DIR)) {
      fs.rmSync(DIST_BACKUP_DIR, { recursive: true });
    }
    fs.renameSync(DIST_DIR, DIST_BACKUP_DIR);
    console.log('   Backed up dist -> dist-cloud-backup');
  }

  // Step 3: Move dist-full to dist
  console.log('\n3️⃣  Swapping to full version...');
  fs.renameSync(DIST_FULL_DIR, DIST_DIR);
  console.log('   Moved dist-full -> dist');

  // Step 4: Publish with "full" tag
  console.log('\n4️⃣  Publishing to npm with "full" tag...');
  try {
    execSync('npm publish --tag full --access public', { cwd: ROOT, stdio: 'inherit' });
    console.log('\n✅ Published successfully with tag "full"!');
    console.log('\n📥 Users can install with:');
    console.log('   npm install @nskha/n8n-nodes-robolly@full');
  } catch (error) {
    console.error('\n❌ Publish failed');
    // Continue to restore
  }

  // Step 5: Restore cloud dist
  console.log('\n5️⃣  Restoring cloud version...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  if (fs.existsSync(DIST_BACKUP_DIR)) {
    fs.renameSync(DIST_BACKUP_DIR, DIST_DIR);
    console.log('   Restored dist-cloud-backup -> dist');
  }

  console.log('\n🎉 Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
