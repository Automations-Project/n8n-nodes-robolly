import fs from 'fs';
import { IBinaryData, IExecuteFunctions, NodeApiError, NodeOperationError } from 'n8n-workflow';
import { createTempFile } from './utils';
import { checkFFmpegAvailability, checkFFprobeAvailability, execFFmpeg, execFFprobeWithOutput } from './ffmpegMethods';

function handleFFmpegImageError(error: any, node: any): never {
	if (error.message === 'FFMPEG_NOT_FOUND') {
		throw new NodeOperationError(
			node,
			'FFmpeg is not installed on this system. Please install FFmpeg to use image conversion features. Installation guide: https://ffmpeg.org/download.html'
		);
	}
	
	if (error.message === 'FFPROBE_NOT_FOUND') {
		throw new NodeOperationError(
			node,
			'FFprobe is not installed on this system. Please install FFmpeg (which includes FFprobe) to use image conversion features. Installation guide: https://ffmpeg.org/download.html'
		);
	}
	
	if (error.message.includes('is not supported by your FFmpeg installation') ||
		error.message.includes('is not available in your FFmpeg installation') ||
		error.message.includes('failed to initialize the output format') ||
		error.message.includes('is not supported by the selected codec') ||
		error.message.includes('is not available in your FFmpeg installation')) {
		throw new NodeOperationError(node, error.message);
	}
	
	throw new NodeApiError(node, error as any);
}

export async function imageToWebP(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.tmp');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.webp');

	try {
		await checkFFmpegAvailability();
		
		fs.writeFileSync(tmpInputPath, imageBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-c:v', 'libwebp',
			'-q:v', '80',
			'-f', 'webp',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'webp');
		
		const responseData = {
			json: {
				success: true,
				format: extentionOutput || 'webp',
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
		
		handleFFmpegImageError(error, this.getNode());
	}
}

export async function imageToAVIF(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.tmp');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.avif');

	try {
		await checkFFmpegAvailability();
		
		fs.writeFileSync(tmpInputPath, imageBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-c:v', 'libaom-av1',
			'-crf', '40',
			'-f', 'avif',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'avif');

		const responseData = {
			json: {
				success: true,
				format: extentionOutput || 'avif',
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
		
		handleFFmpegImageError(error, this.getNode());
	}
}

export async function imageToTIFF(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.tmp');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.tiff');

	try {
		await checkFFmpegAvailability();
		
		fs.writeFileSync(tmpInputPath, imageBuffer);

		await execFFmpeg([
			'-i', tmpInputPath,
			'-c:v', 'tiff',
			'-compression_algo', 'lzw',
			'-f', 'tiff',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'tiff');
		
		const responseData = {
			json: {
				success: true,
				format: extentionOutput || 'tiff',
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
		
		handleFFmpegImageError(error, this.getNode());
	}
}

export async function imageToRaw(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpInputPath, cleanup: cleanupInput } = await createTempFile('.tmp');
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await createTempFile('.raw');

	try {
		await checkFFmpegAvailability();
		await checkFFprobeAvailability();
		
		fs.writeFileSync(tmpInputPath, imageBuffer);

		const probeOutput = await execFFprobeWithOutput([
			'-v', 'quiet',
			'-print_format', 'json',
			'-show_streams',
			tmpInputPath
		]);

		const probeData = JSON.parse(probeOutput);
		const videoStream = probeData.streams.find((s: any) => s.codec_type === 'video');
		const width = videoStream?.width || 0;
		const height = videoStream?.height || 0;

		await execFFmpeg([
			'-i', tmpInputPath,
			'-f', 'rawvideo',
			'-pix_fmt', 'rgb24',
			'-y',
			tmpOutputPath
		]);

		const outputBuffer = fs.readFileSync(tmpOutputPath);
		const binaryData = await this.helpers.prepareBinaryData(outputBuffer, extentionOutput || 'bin');
		
		const responseData = {
			json: {
				success: true,
				format: extentionOutput || 'bin',
				width: width,
				height: height,
				channels: 3,
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
		
		handleFFmpegImageError(error, this.getNode());
	}
}