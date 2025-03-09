import fs from 'fs';
import sharp from 'sharp';
import { file } from 'tmp-promise';
import type { IBinaryData, IExecuteFunctions } from 'n8n-workflow';

export async function imageToWebP(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	// Create a temporary output file
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.webp' });

	try {
		// Convert to WebP (quality ~ 80 is typical)
		const outputBuffer = await sharp(imageBuffer).webp({ quality: 80 }).toBuffer();

		fs.writeFileSync(tmpOutputPath, outputBuffer);

		// Prepare the data for n8n
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

		await cleanupOutput();
		return { binaryData, responseData };
	} catch (error) {
		await cleanupOutput();
		throw error;
	}
}

export async function imageToAVIF(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.avif' });

	try {
		// AVIF encoding (quality range ~30–50 is common)
		const outputBuffer = await sharp(imageBuffer)
			.avif({
				quality: 40,
			})
			.toBuffer();

		fs.writeFileSync(tmpOutputPath, outputBuffer);

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

		await cleanupOutput();
		return { binaryData, responseData };
	} catch (error) {
		await cleanupOutput();
		throw error;
	}
}

export async function imageToTIFF(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.tiff' });

	try {
		// Convert to TIFF (compression: 'lzw', 'deflate', 'jpeg', etc.)
		const outputBuffer = await sharp(imageBuffer)
			.tiff({
				compression: 'lzw',
				quality: 80,
			})
			.toBuffer();

		fs.writeFileSync(tmpOutputPath, outputBuffer);

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

		await cleanupOutput();
		return { binaryData, responseData };
	} catch (error) {
		await cleanupOutput();
		throw error;
	}
}

export async function imageToRaw(this: IExecuteFunctions, imageBuffer: Buffer, url: string, extentionOutput: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
	// We'll write the raw output to .bin
	const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.bin' });

	try {
		// Convert to raw pixel data
		const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

		// 'data' is a Buffer containing raw pixel data (no headers)
		// 'info' gives width, height, channels, etc.
		fs.writeFileSync(tmpOutputPath, data);

		const binaryData = await this.helpers.prepareBinaryData(data, extentionOutput || 'bin');
		const responseData = {
			json: {
				success: true,
				format: extentionOutput || 'bin',
				width: info.width,
				height: info.height,
				channels: info.channels,
				size: data.length,
				url,
			},
			binary: {
				data: binaryData,
			},
		};

		await cleanupOutput();
		return { binaryData, responseData };
	} catch (error) {
		await cleanupOutput();
		throw error;
	}
}
