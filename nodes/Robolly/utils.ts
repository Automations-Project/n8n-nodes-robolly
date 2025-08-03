import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

export interface TempFile {
	path: string;
	cleanup: () => Promise<void>;
}

export async function createTempFile(postfix: string): Promise<TempFile> {
	const randomName = crypto.randomBytes(16).toString('hex');
	const tempPath = path.join(os.tmpdir(), `n8n-robolly-${randomName}${postfix}`);
	
	return {
		path: tempPath,
		cleanup: async () => {
			try {
				if (fs.existsSync(tempPath)) {
					await fs.promises.unlink(tempPath);
				}
			} catch (error) {
				// Ignore cleanup errors to prevent workflow failures
			}
		}
	};
} 