import { spawn } from 'child_process';
import fs from 'fs';
import { IBinaryData, IExecuteFunctions, NodeApiError, NodeOperationError } from 'n8n-workflow';
import { createTempFile } from './utils';

export async function checkFFmpegAvailability(): Promise<void> {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn('ffmpeg', ['-version'], { stdio: ['pipe', 'pipe', 'pipe'] });
		
		ffmpeg.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error('FFmpeg not working properly'));
			}
		});
		
		ffmpeg.on('error', (error) => {
			if (error.message.includes('ENOENT')) {
				reject(new Error('FFMPEG_NOT_FOUND'));
			} else {
				reject(new Error(`FFmpeg error: ${error.message}`));
			}
		});
	});
}

export async function checkFFprobeAvailability(): Promise<void> {
	return new Promise((resolve, reject) => {
		const ffprobe = spawn('ffprobe', ['-version'], { stdio: ['pipe', 'pipe', 'pipe'] });
		
		ffprobe.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error('FFprobe not working properly'));
			}
		});
		
		ffprobe.on('error', (error) => {
			if (error.message.includes('ENOENT')) {
				reject(new Error('FFPROBE_NOT_FOUND'));
			} else {
				reject(new Error(`FFprobe error: ${error.message}`));
			}
		});
	});
}

export async function execFFmpeg(args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });
		
		let stderr = '';
		
		ffmpeg.stderr.on('data', (data) => {
			stderr += data.toString();
		});
		
		ffmpeg.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
			}
		});
		
		ffmpeg.on('error', (error) => {
			if (error.message.includes('ENOENT')) {
				reject(new Error('FFMPEG_NOT_FOUND'));
			} else {
				reject(new Error(`Failed to start FFmpeg: ${error.message}`));
			}
		});
	});
}

export async function execFFprobeWithOutput(args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		const ffprobe = spawn('ffprobe', args);
		
		let stdout = '';
		let stderr = '';
		
		ffprobe.stdout.on('data', (data) => {
			stdout += data.toString();
		});
		
		ffprobe.stderr.on('data', (data) => {
			stderr += data.toString();
		});
		
		ffprobe.on('close', (code) => {
			if (code === 0) {
				resolve(stdout);
			} else {
				reject(new Error(`FFprobe failed with code ${code}: ${stderr}`));
			}
		});
		
		ffprobe.on('error', (error) => {
			if (error.message.includes('ENOENT')) {
				reject(new Error('FFPROBE_NOT_FOUND'));
			} else {
				reject(new Error(`Failed to start FFprobe: ${error.message}`));
			}
		});
	});
}

export async function mp4ToGifWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.mp4');
	const { path: tmpPalettePath, cleanup: cleanupPalette } = await createTempFile('.png');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.gif');

	try {
		await checkFFmpegAvailability();
		
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		// Generate optimal color palette for better GIF quality
		await execFFmpeg([
			'-i', tmpInputPath,
			'-vf', 'fps=10,scale=320:-1:flags=lanczos,palettegen=stats_mode=full',
			'-y',
			tmpPalettePath
		]);

		// Convert using the generated palette for better colors and compression
		await execFFmpeg([
			'-i', tmpInputPath,
			'-i', tmpPalettePath,
			'-lavfi', 'fps=10,scale=320:-1:flags=lanczos [x]; [x][1:v] paletteuse',
			'-f', extentionOutput.replace('.', '') || 'gif',
			'-y',
			tmpOutputPath
		]);

		const gifBuffer = fs.readFileSync(tmpOutputPath);

		const binaryData = await this.helpers.prepareBinaryData(gifBuffer, extentionOutput || 'gif');

		const responseData = {
			json: {
				success: true,
				format: '.gif',
				size: gifBuffer.length,
				url: url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupInput();
		await cleanupPalette();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupPalette();
		await cleanupOutput();
		
		if (error.message === 'FFMPEG_NOT_FOUND') {
			throw new NodeOperationError(
				this.getNode(),
				'FFmpeg is not installed on this system. Please install FFmpeg to use video conversion features. Installation guide: https://ffmpeg.org/download.html'
			);
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function mp4ToWebPWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.mp4');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.webp');

	try {
		await checkFFmpegAvailability();
		
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-vf', 'fps=10,scale=320:-1:flags=lanczos',
			'-c:v', 'libwebp',
			'-q:v', '50',
			'-lossless', '0',
			'-preset', 'default',
			'-loop', '0',
			'-an',
			'-vsync', '0',
			'-f', extentionOutput.replace('.', '') || 'webp',
			'-y',
			tmpOutputPath
		]);

		const webpBuffer = fs.readFileSync(tmpOutputPath);

		const binaryData = await this.helpers.prepareBinaryData(webpBuffer, extentionOutput || 'webp');

		const responseData = {
			json: {
				success: true,
				format: '.webp',
				size: webpBuffer.length,
				url: url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		
		if (error.message === 'FFMPEG_NOT_FOUND') {
			throw new NodeOperationError(
				this.getNode(),
				'FFmpeg is not installed on this system. Please install FFmpeg to use video conversion features. Installation guide: https://ffmpeg.org/download.html'
			);
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function mp4ToAV1WithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.mp4');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.mp4');

	try {
		await checkFFmpegAvailability();
		
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-vf', 'fps=10,scale=320:-1:flags=lanczos',
			'-c:v', 'libaom-av1',
			'-crf', '30',
			'-b:v', '0',
			'-cpu-used', '4',
			'-pix_fmt', 'yuv420p',
			'-an',
			'-f', extentionOutput.replace('.', '') || 'mp4',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'mp4');

		const responseData = {
			json: {
				success: true,
				format: '.mp4 (AV1)',
				size: outputBuffer.length,
				url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		
		if (error.message === 'FFMPEG_NOT_FOUND') {
			throw new NodeOperationError(
				this.getNode(),
				'FFmpeg is not installed on this system. Please install FFmpeg to use video conversion features. Installation guide: https://ffmpeg.org/download.html'
			);
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function mp4ToHEVCWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.mp4');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.mp4');

	try {
		await checkFFmpegAvailability();
		
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-vf', 'fps=10,scale=320:-1:flags=lanczos',
			'-c:v', 'libx265',
			'-crf', '28',
			'-preset', 'medium',
			'-pix_fmt', 'yuv420p',
			'-an',
			'-f', 'mp4',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'mp4');

		const responseData = {
			json: {
				success: true,
				format: '.mp4 (HEVC/H.265)',
				size: outputBuffer.length,
				url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		
		if (error.message === 'FFMPEG_NOT_FOUND') {
			throw new NodeOperationError(
				this.getNode(),
				'FFmpeg is not installed on this system. Please install FFmpeg to use video conversion features. Installation guide: https://ffmpeg.org/download.html'
			);
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function mp4ToVP9WithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.mp4');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.webm');

	try {
		await checkFFmpegAvailability();
		
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-vf', 'fps=10,scale=320:-1:flags=lanczos',
			'-c:v', 'libvpx-vp9',
			'-crf', '30',
			'-b:v', '1M',
			'-deadline', 'good',
			'-pix_fmt', 'yuv420p',
			'-an',
			'-f', extentionOutput.replace('.', '') || 'webm',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'webm');

		const responseData = {
			json: {
				success: true,
				format: '.webm (VP9)',
				size: outputBuffer.length,
				url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		
		if (error.message === 'FFMPEG_NOT_FOUND') {
			throw new NodeOperationError(
				this.getNode(),
				'FFmpeg is not installed on this system. Please install FFmpeg to use video conversion features. Installation guide: https://ffmpeg.org/download.html'
			);
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function mp4ToH264WithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.mp4');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.mp4');

	try {
		await checkFFmpegAvailability();
		
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-vf', 'fps=10,scale=320:-1:flags=lanczos',
			'-c:v', 'libx264',
			'-crf', '23',
			'-preset', 'medium',
			'-pix_fmt', 'yuv420p',
			'-an',
			'-f', extentionOutput.replace('.', '') || 'mp4',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'mp4');

		const responseData = {
			json: {
				success: true,
				format: '.mp4 (H.264/AVC)',
				size: outputBuffer.length,
				url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		
		if (error.message === 'FFMPEG_NOT_FOUND') {
			throw new NodeOperationError(
				this.getNode(),
				'FFmpeg is not installed on this system. Please install FFmpeg to use video conversion features. Installation guide: https://ffmpeg.org/download.html'
			);
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function mp4ToWebMWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.mp4');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.webm');

	try {
		await checkFFmpegAvailability();
		
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-vf', 'fps=10,scale=320:-1:flags=lanczos',
			'-c:v', 'libvpx-vp9',
			'-crf', '30',
			'-b:v', '1M',
			'-deadline', 'good',
			'-pix_fmt', 'yuv420p',
			'-an',
			'-f', extentionOutput.replace('.', '') || 'webm',
			'-y',
			tmpOutputPath
		]);

		const webmBuffer = fs.readFileSync(tmpOutputPath);

		const binaryData = await this.helpers.prepareBinaryData(webmBuffer, extentionOutput || 'webm');

		const responseData = {
			json: {
				success: true,
				format: '.webm (VP9)',
				size: webmBuffer.length,
				url: url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		
		if (error.message === 'FFMPEG_NOT_FOUND') {
			throw new NodeOperationError(
				this.getNode(),
				'FFmpeg is not installed on this system. Please install FFmpeg to use video conversion features. Installation guide: https://ffmpeg.org/download.html'
			);
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}