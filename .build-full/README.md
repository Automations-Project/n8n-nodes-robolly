# Full Version Source Files

This directory contains FFmpeg/Sharp-based conversion files for the **full** version of the package.

## Required Files

Place these files here to enable full version builds:

### FFmpeg-specific files (copy from git history or backup):
- `ffmpegMethods.ts` - Video conversion using FFmpeg/child_process
- `sharpMethods.ts` - Image conversion using Sharp/fs  
- `utils.ts` - File system utilities (fs, os, path)

### Variant files (full version of existing files):
- `methods.full.ts` - Methods with FFmpeg imports and conversion calls
- `fields.full.ts` - Fields with "Change Encoding" UI options
- `extentionConvetor.full.ts` - Extension converter with FFmpeg calls

## Build Commands

```bash
# Check status of full version files
pnpm run build:full status

# Build cloud version (default, n8n Cloud compatible)
pnpm run build

# Build full version (self-hosted only)
pnpm run build:full

# Build both variants
pnpm run build:both
```

## Publishing

```bash
# Publish cloud version (default tag)
npm publish --access public

# Publish full version (with "full" tag)
pnpm run publish:full
```

## Installation (for users)

```bash
# Cloud version (default) - works on n8n Cloud
npm install @nskha/n8n-nodes-robolly

# Full version - self-hosted only, requires FFmpeg
npm install @nskha/n8n-nodes-robolly@full
```

## Important Notes

⚠️ **Full version requirements:**
- FFmpeg must be installed on the system
- NOT compatible with n8n Cloud
- Use only for self-hosted n8n instances

✅ **Cloud version (default):**
- Works on n8n Cloud and self-hosted
- No local conversion features
- Images/videos returned in original API format
