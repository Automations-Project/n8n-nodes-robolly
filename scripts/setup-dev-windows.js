const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageName = 'n8n-nodes-robolly';
const userProfile = process.env.USERPROFILE;

if (!userProfile) {
  console.error('USERPROFILE environment variable is not set. Cannot determine custom extensions directory.');
  process.exit(1);
}

const customRoot = path.join(userProfile, '.n8n', 'custom');
const customDir = path.join(customRoot, packageName);
const distDir = path.join(process.cwd(), 'dist');
const args = new Set(process.argv.slice(2));
const reloadOnly = args.has('--reload-only');
const startOnly = args.has('--start-only');
const noLogs = args.has('--no-logs');
const attachLogs = args.has('--attach-logs') || (!noLogs && !reloadOnly && !startOnly);

if (!fs.existsSync(distDir)) {
  console.error('Build output not found. Run "pnpm run build" before starting the Windows dev environment.');
  process.exit(1);
}

fs.mkdirSync(customDir, { recursive: true });
fs.rmSync(path.join(customDir, 'dist'), { recursive: true, force: true });
fs.cpSync(distDir, path.join(customDir, 'dist'), { recursive: true });
fs.copyFileSync('package.json', path.join(customDir, 'package.json'));

// Install dependencies in custom directory
console.log('[setup] Installing dependencies in custom directory...');
try {
  execSync('npm install --production --no-save', {
    cwd: customDir,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('[setup] Failed to install dependencies. The node may not work correctly.');
}

const env = {
  ...process.env,
  N8N_CUSTOM_EXTENSIONS: customRoot,
	  N8N_LOG_LEVEL: 'debug',
  N8N_LOG_OUTPUT: 'console',
  N8N_DEV_RELOAD: true,
  NODE_ENV: 'development'
};

const startPm2 = () => {
  execSync('pm2 start ecosystem.config.js --only n8n-dev', { stdio: 'inherit', env });
};

const reloadPm2 = () => {
  try {
    // Force restart instead of reload to clear all caches
    console.log('[setup] Restarting n8n-dev to clear caches...');
    execSync('pm2 restart n8n-dev --update-env', { stdio: 'inherit', env });
  } catch (error) {
    console.warn('pm2 restart failed, attempting to start n8n-dev instead.');
    startPm2();
  }
};

if (reloadOnly) {
  reloadPm2();
  if (attachLogs) {
    execSync('pm2 logs n8n-dev', { stdio: 'inherit', env });
  }
  process.exit(0);
}

if (startOnly) {
  startPm2();
  if (attachLogs) {
    execSync('pm2 logs n8n-dev', { stdio: 'inherit', env });
  }
  process.exit(0);
}

try {
  execSync('pm2 delete n8n-dev', { stdio: 'ignore', env });
} catch (error) {
  // Ignore if process does not exist
}

startPm2();

if (attachLogs) {
  execSync('pm2 logs n8n-dev', { stdio: 'inherit', env });
}
