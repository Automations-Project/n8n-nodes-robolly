import { mp4ToAV1WithCompression, mp4ToGifWithCompression, mp4ToH264WithCompression, mp4ToHEVCWithCompression, mp4ToVP9WithCompression, mp4ToWebMWithCompression, mp4ToWebPWithCompression } from './ffmpegMethods';
import { imageToWebP, imageToAVIF, imageToTIFF, imageToRaw } from './sharpMethods';
import { IExecuteFunctions } from 'n8n-workflow';
export async function VideoExtentionConvertor(this: IExecuteFunctions, videoBuffer: Buffer, url: string, convertToVideo: string, extentionOutput: string) {
	switch (convertToVideo) {
		case '.gif':
			return await mp4ToGifWithCompression.call(this, videoBuffer, url, extentionOutput);
		case '.webp':
			return await mp4ToWebPWithCompression.call(this, videoBuffer, url, extentionOutput);
		case '.webm':
			return await mp4ToWebMWithCompression.call(this, videoBuffer, url, extentionOutput);
		case '.av1':
			return await mp4ToAV1WithCompression.call(this, videoBuffer, url, extentionOutput);
		case '.hevc':
			return await mp4ToHEVCWithCompression.call(this, videoBuffer, url, extentionOutput);
		case '.h264':
			return await mp4ToH264WithCompression.call(this, videoBuffer, url, extentionOutput);
		case '.vp9':
			return await mp4ToVP9WithCompression.call(this, videoBuffer, url, extentionOutput);
		default:
			return { binaryData: videoBuffer, responseData: { json: { success: true, format: '.mp4', size: videoBuffer.length, url: url } } };
	}
}

export async function ImageExtentionConvertor(this: IExecuteFunctions, imageBuffer: Buffer, url: string, convertToIMG: string, extentionOutput: string) {
	switch (convertToIMG) {
		case '.webp':
			return await imageToWebP.call(this, imageBuffer, url, extentionOutput || '.webp');
		case '.avif':
			return await imageToAVIF.call(this, imageBuffer, url, extentionOutput || '.avif');
		case '.tiff':
			return await imageToTIFF.call(this, imageBuffer, url, extentionOutput || '.tiff');
		case '.raw':
			return await imageToRaw.call(this, imageBuffer, url, extentionOutput || '.raw');
		default:
			return {
				binaryData: imageBuffer,
				responseData: {
					json: {
						success: true,
						format: extentionOutput || convertToIMG,
						size: imageBuffer.length,
						url: url,
					},
				},
			};
	}
}

export const calculateTotalDuration = (data: any): number => {
	let total = 0;

	// Check if data has timeline property and it's an array
	if (data?.timeline && Array.isArray(data.timeline)) {
		// Sum up all duration values in timeline
		data.timeline.forEach((item: any) => {
			if (item?.duration && typeof item.duration === 'number') {
				total += item.duration;
			}
		});
	}
	return total;
};
