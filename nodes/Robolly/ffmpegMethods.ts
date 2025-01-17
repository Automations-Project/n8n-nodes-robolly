import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { file } from 'tmp-promise';
import { IBinaryData, IExecuteFunctions } from 'n8n-workflow';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
else throw new Error('ffmpeg-static path not found');

export async function mp4ToGifWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	// Create temporary file paths
	const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
	const { path: tmpPalettePath, cleanup: cleanupPalette } = await file({ postfix: '.png' });
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.gif' });

	try {
		// Write the input MP4 video buffer to a tmp file
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		// ───────────────────────────────────────────────
		// 1. Generate a palette (first pass)
		//    Adjust fps / scale / etc. as needed
		// ───────────────────────────────────────────────
		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				// Set a lower fps for smaller size (e.g., 10). Adjust as needed.
				// Lanczos scaling often provides a good trade-off between quality & size.
				.outputOptions(['-vf', 'fps=10,scale=320:-1:flags=lanczos,palettegen=stats_mode=full'])
				.output(tmpPalettePath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

		// ───────────────────────────────────────────────
		// 2. Use the palette to convert to GIF (second pass)
		// ───────────────────────────────────────────────
		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				.input(tmpPalettePath)
				// Applies the palette to reduce banding and keep file size lower
				.outputOptions(['-lavfi', 'fps=10,scale=320:-1:flags=lanczos [x]; [x][1:v] paletteuse'])
				.format(extentionOutput || 'gif')
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

		// Read the output GIF back into a buffer
		const gifBuffer = fs.readFileSync(tmpOutputPath);

		// Prepare the binary data (n8n-specific helper)
		const binaryData = await this.helpers.prepareBinaryData(gifBuffer, extentionOutput || 'gif');

		// Build final response
		const responseData = {
			json: {
				success: true,
				format: '.gif',
				size: gifBuffer.length, // final size in bytes
				url: url,
			},
			binary: {
				data: binaryData,
			},
		};

		// Cleanup temp files
		await cleanupInput();
		await cleanupPalette();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupPalette();
		await cleanupOutput();
		throw error;
	}
}

export async function mp4ToWebPWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	// Create temporary file paths
	const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.webp' });

	try {
		// Write the input MP4 video buffer to a temp file
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		// ───────────────────────────────────────────────
		// Convert MP4 -> WebP with compression
		// Adjust parameters below (fps, scale, q:v, etc.) as needed
		// ───────────────────────────────────────────────
		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				// fps=10, scale=320 (width), keep aspect ratio; Lanczos scaler for quality
				.outputOptions([
					'-vf',
					'fps=10,scale=320:-1:flags=lanczos',
					// Use libwebp for WebP output
					'-c:v',
					'libwebp',
					// Set the quality parameter: 0 (best) to 100 (worst); the lower, the higher the quality
					'-q:v',
					'50',
					// 0 for non-lossless, helps reduce size
					'-lossless',
					'0',
					// The WebP preset can be 'default', 'drawing', 'photo', 'picture', or 'icon'
					'-preset',
					'default',
					// 0 = infinite loop (like an animated GIF). Set to 1 for no looping.
					'-loop',
					'0',
					// Remove audio
					'-an',
					'-vsync',
					'0',
				])
				.format(extentionOutput || 'webp')
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

		// Read the output WebP back into a buffer
		const webpBuffer = fs.readFileSync(tmpOutputPath);

		// Prepare the binary data for n8n
		const binaryData = await this.helpers.prepareBinaryData(webpBuffer, extentionOutput || 'webp');

		// Build final response
		const responseData = {
			json: {
				success: true,
				format: '.webp',
				size: webpBuffer.length, // final size in bytes
				url: url,
			},
			binary: {
				data: binaryData,
			},
		};

		// Cleanup temp files
		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		throw error;
	}
}

export async function mp4ToAV1WithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.av1' });

	try {
		// Write the input MP4 video buffer
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				// Scale & fps
				.outputOptions([
					'-vf',
					'fps=10,scale=320:-1:flags=lanczos',
					// Use AV1 encoder
					'-c:v',
					'libaom-av1',
					// Use a CRF (Constant Rate Factor) for quality control
					'-crf',
					'30',
					// 0 = constant quality mode (no cap on bitrate)
					'-b:v',
					'0',
					// Speed/Quality trade-off. 0=best, 8=fastest
					'-cpu-used',
					'4',
					// Ensure correct pixel format
					'-pix_fmt',
					'yuv420p',
					// Remove audio
					'-an',
				])
				.format(extentionOutput || 'mp4')
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

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
		throw error;
	}
}

export async function mp4ToHEVCWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.mp4' });

	try {
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				.outputOptions([
					'-vf',
					'fps=10,scale=320:-1:flags=lanczos',
					// Use libx265 for HEVC (H.265)
					'-c:v',
					'libx265',
					// Constant Rate Factor for quality, lower is higher quality
					'-crf',
					'28',
					// Preset can be ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
					'-preset',
					'medium',
					// Ensure correct pixel format
					'-pix_fmt',
					'yuv420p',
					// Remove audio
					'-an',
				])
				.format('mp4')
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

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
		throw error;
	}
}

export async function mp4ToVP9WithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.webm' });

	try {
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				.outputOptions([
					'-vf',
					'fps=10,scale=320:-1:flags=lanczos',
					'-c:v',
					'libvpx-vp9',
					// CRF (quality), range: 0–63; lower = better quality
					'-crf',
					'30',
					// Bitrate target (optional). If you omit, you get a purely CRF-based encode.
					'-b:v',
					'1M',
					// Good, best, realtime
					'-deadline',
					'good',
					// Ensure correct pixel format
					'-pix_fmt',
					'yuv420p',
					'-an', // no audio
				])
				.format(extentionOutput || 'webm')
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

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
		throw error;
	}
}

export async function mp4ToH264WithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.mp4' });

	try {
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				.outputOptions([
					'-vf',
					'fps=10,scale=320:-1:flags=lanczos',
					// Use libx264 for H.264/AVC
					'-c:v',
					'libx264',
					// CRF for quality; typical range ~18–28 (18=high quality, 28=lower)
					'-crf',
					'23',
					// Preset: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
					'-preset',
					'medium',
					// Force pixel format
					'-pix_fmt',
					'yuv420p',
					// Remove audio
					'-an',
				])
				.format(extentionOutput || 'mp4')
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

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
		throw error;
	}
}

export async function mp4ToWebMWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	// Create temporary file paths
	const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.webm' });

	try {
		// Write the input MP4 video buffer to a tmp file
		await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

		// ───────────────────────────────────────────────
		// Convert MP4 -> WebM (VP9)
		// ───────────────────────────────────────────────
		await new Promise<void>((resolve, reject) => {
			ffmpeg(tmpInputPath)
				// You can adjust fps and scale as needed
				.outputOptions([
					'-vf',
					'fps=10,scale=320:-1:flags=lanczos',
					// Use VP9 codec
					'-c:v',
					'libvpx-vp9',
					// CRF for quality (lower = better quality, bigger file size), typical range: 10–40
					'-crf',
					'30',
					// Bitrate target. Optional if using CRF, but can help set an upper bound.
					'-b:v',
					'1M',
					// Speed/quality trade-off: (good, best, realtime)
					'-deadline',
					'good',
					// Force the pixel format
					'-pix_fmt',
					'yuv420p',
					// Remove audio track
					'-an',
				])
				.format(extentionOutput || 'webm')
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

		// Read the output WebM back into a buffer
		const webmBuffer = fs.readFileSync(tmpOutputPath);

		// Prepare the binary data for n8n
		const binaryData = await this.helpers.prepareBinaryData(webmBuffer, extentionOutput || 'webm');

		// Build final response
		const responseData = {
			json: {
				success: true,
				format: '.webm (VP9)',
				size: webmBuffer.length, // final size in bytes
				url: url,
			},
			binary: {
				data: binaryData,
			},
		};

		// Cleanup temp files
		await cleanupInput();
		await cleanupOutput();

		return { binaryData, responseData };
	} catch (error) {
		await cleanupInput();
		await cleanupOutput();
		throw error;
	}
}
