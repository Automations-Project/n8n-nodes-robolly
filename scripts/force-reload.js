const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageName = 'n8n-nodes-robolly';
const userProfile = process.env.USERPROFILE;

if (!userProfile) {
  console.error('USERPROFILE environment variable is not set.');
  process.exit(1);
}

const customRoot = path.join(userProfile, '.n8n', 'custom');
const customDir = path.join(customRoot, packageName);
const distDir = path.join(process.cwd(), 'dist');

console.log('[force-reload] Performing full rebuild and cache clear...');

const env = {
  ...process.env,
  N8N_CUSTOM_EXTENSIONS: customRoot,
	N8N_LOG_LEVEL: 'debug',
	N8N_LOG_OUTPUT: 'console',
	N8N_DEV_RELOAD: true,
	NODE_ENV: 'development'
};

// Step 0: Stop n8n FIRST to unlock files
console.log('[force-reload] Stopping n8n-dev to unlock files...');
try {
  execSync('pm2 delete n8n-dev', { stdio: 'inherit', env });
  console.log('[force-reload] Stopped n8n-dev.');
} catch (error) {
  console.log('[force-reload] n8n-dev was not running.');
}

// Step 1: Build everything from scratch
console.log('[force-reload] Building project...');
try {
  execSync('npx rimraf dist', { stdio: 'inherit' });
  execSync('tsc', { stdio: 'inherit' });
  execSync('npx gulp build:icons', { stdio: 'inherit' });
} catch (error) {
  console.error('[force-reload] Build failed:', error.message);
  process.exit(1);
}

// Step 2: Clear custom directory completely (with retry for Windows file locks)
console.log('[force-reload] Clearing custom directory...');

// Helper to sleep for Windows
function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy wait (not ideal but works synchronously)
  }
}

let retries = 5;
while (retries > 0 && fs.existsSync(customDir)) {
  try {
    fs.rmSync(customDir, { recursive: true, force: true });
    break;
  } catch (error) {
    if (error.code === 'EBUSY' && retries > 1) {
      console.log(`[force-reload] Directory locked, waiting 2 seconds (${retries - 1} retries left)...`);
      sleep(2000);
      retries--;
    } else {
      throw error;
    }
  }
}
fs.mkdirSync(customDir, { recursive: true });

// Step 3: Copy fresh build
console.log('[force-reload] Copying fresh build to custom directory...');
fs.cpSync(distDir, path.join(customDir, 'dist'), { recursive: true });
fs.copyFileSync('package.json', path.join(customDir, 'package.json'));

// Step 3.5: Install dependencies
console.log('[force-reload] Installing dependencies in custom directory...');
try {
  execSync('npm install --production --no-save', {
    cwd: customDir,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('[force-reload] Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 4: Start n8n with fresh build
console.log('[force-reload] Starting n8n-dev with cleared cache...');

try {
  execSync('pm2 start ecosystem.config.js --only n8n-dev', { stdio: 'inherit', env });
  console.log('[force-reload] Started n8n-dev with cleared cache.');
  console.log('[force-reload] Complete! Your node should now reflect all changes with dependencies installed.');
} catch (error) {
  console.error('[force-reload] Failed to start n8n-dev:', error.message);
  process.exit(1);
}
