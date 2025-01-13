import { IBinaryData, IExecuteFunctions, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { genericHttpRequest, RobollyResponse } from '../../GenericFunctions';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import { file } from 'tmp-promise';
import ffmpegPath from 'ffmpeg-static';
import * as fs from 'fs';
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
else throw new Error('ffmpeg-static path not found');

export async function getTemplatesid(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		// Get the current operation from the node parameters
		const operation = this.getNodeParameter('operation') as string;

		const response = (await genericHttpRequest.call(this, 'GET', `/v1/templates`, {})) as RobollyResponse;

		if (!response || !response.templates || !Array.isArray(response.templates)) {
			throw new Error('Invalid response format');
		}

		// Filter templates only for specific operations, otherwise return all
		const filteredTemplates = ['generateImage', 'generateVideo'].includes(operation)
			? response.templates.filter((template: any) => {
					if (operation === 'generateImage') {
						return template.transition === null;
					}
					if (operation === 'generateVideo') {
						return template.transition !== null;
					}
					return true;
			  })
			: response.templates;

		return filteredTemplates.map((template: any) => ({
			name: template.name || 'Unnamed Template',
			value: template.id,
			description: `Template ID: ${template.id}`,
		}));
	} catch (error) {
		console.error('Error loading templates:', error);
		return [];
	}
}

export async function getTemplateElementsOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const options: INodePropertyOptions[] = [];

	try {
		const templateId = this.getNodeParameter('templateId') as string;

		const response = (await genericHttpRequest.call(this, 'GET', `/v1/templates/${templateId}/accepted-modifications`, {})) as RobollyResponse;

		if (!response?.acceptedModifications) {
			return options;
		}

		// First pass: Add all non-rect elements
		response.acceptedModifications.forEach((item: any) => {
			if (item.elementType !== 'rect') {
				options.push({
					name: item.key,
					value: item.key,
					description: `${item.elementType} type: ${item.type}`,
				});
			}
		});

		// Second pass: Add text color options
		response.acceptedModifications.forEach((item: any) => {
			if (item.elementType === 'text') {
				options.push({
					name: `${item.key} (Text Color)`,
					value: `${item.key}.textColor`,
					description: 'Text color property',
				});
			}
		});

		// Third pass: Add rect elements and their colors
		response.acceptedModifications.forEach((item: any) => {
			if (item.elementType === 'rect') {
				options.push({
					name: item.key,
					value: item.key,
					description: 'Rectangle element',
				});
				options.push({
					name: `${item.key} (Background Color)`,
					value: `${item.key}.background.color`,
					description: 'Background color property',
				});
			}
		});

		return options;
	} catch (error) {
		console.error('Error in getTemplateElements:', error);
		return options;
	}
}

export async function handleGetAllTemplates(this: IExecuteFunctions) {
	const templatesType = this.getNodeParameter('templatesType', 0) as string;

	const response = (await genericHttpRequest.call(this, 'GET', `/v1/templates`, {})) as RobollyResponse;

	if (templatesType !== 'all' && response?.templates) {
		response.templates = response.templates.filter((template: any) => {
			if (templatesType === 'image') {
				return template.transition === null;
			}
			if (templatesType === 'video') {
				return template.transition !== null;
			}
			return true;
		});
	}

	return response;
}

export async function handleGetTemplateElements(this: IExecuteFunctions) {
	const templateId = this.getNodeParameter('templateId', 0) as string;
	const responseData = (await genericHttpRequest.call(this, 'GET', `/v1/templates/${templateId}/accepted-modifications`, {})) as RobollyResponse;

	return responseData;
}

export async function handleGenerateImage(this: IExecuteFunctions) {
	const imageTemplate = this.getNodeParameter('imageTemplate', 0) as string;
	// console.log('templateId:', templateId);

	let imageFormat = this.getNodeParameter('imageFormat', 0) as string;
	// console.log('imageFormat:', imageFormat);

	const elements = this.getNodeParameter('elements', 0) as {
		ElementValues?: Array<{
			elementName: string;
			value: string;
		}>;
	};
	// console.log('Raw elements:', elements);

	const elementValues = elements.ElementValues || [];
	// console.log('Element values:', elementValues);

	const Quallity = this.getNodeParameter('quality', 0, '1') as string;

	// Create base URL
	let url = `https://api.robolly.com/templates/${imageTemplate}/render${imageFormat}?scale=${Quallity}`;
	// console.log('Initial URL:', url);
	const urlParams: string[] = [];

	// Modified element parameters handling
	if (elementValues && elementValues.length > 0) {
		const elementParams = elementValues
			.map(({ elementName, value }) => {
				if (!elementName || !value) return '';
				if (typeof value === 'string') {
					if (elementName.includes('.color')) {
						value = value.startsWith('#') ? value : '#' + value;
					}
					return `${elementName}=${encodeURIComponent(value)}`;
				}
				return '';
			})
			.filter(Boolean);
		urlParams.push(...elementParams);
	}

	// Add parameters to URL if any exist
	if (urlParams.length) {
		url += '&' + urlParams.join('&');
	}

	// console.log('Final URL:', url);

	const credentials = await this.getCredentials('robollyApi');
	const apiToken = credentials?.apikey as string;

	const response = await axios({
		method: 'GET',
		url: url,
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
		responseType: 'arraybuffer',
	});

	let binaryData = await this.helpers.prepareBinaryData(Buffer.from(response.data), imageFormat.substring(1));

	let responseData = {
		json: {
			success: true,
			format: imageFormat,
			size: response.data.length,
			url: url,
		},
		binary: {
			data: binaryData,
		},
	};

	return responseData;
}

export async function handleGenerateVideo(this: IExecuteFunctions) {
	const videoTemplate = this.getNodeParameter('videoTemplate', 0) as string;
	// console.log('templateId:', templateId);

	let videoFormat = this.getNodeParameter('videoFormat', 0) as string;
	// console.log('imageFormat:', imageFormat);

	const elements = this.getNodeParameter('elements', 0) as {
		ElementValues?: Array<{
			elementName: string;
			value: string;
		}>;
	};
	// console.log('Raw elements:', elements);

	const elementValues = elements.ElementValues || [];
	// console.log('Element values:', elementValues);

	const videoQuality = this.getNodeParameter('quality', 0, '1') as string;
	// console.log('imageQuality:', imageQuality);

	let duration = this.getNodeParameter('duration', 0, 0) as number;
	// console.log('duration:', duration);

	// Create base URL
	let url = `https://api.robolly.com/templates/${videoTemplate}/render.mp4?scale=${videoQuality}`;
	// console.log('Initial URL:', url);

	// Collect all parameters in an array
	const urlParams: string[] = [];

	// Add duration parameter if applicable
	if (duration) {
		duration = duration * 1000;
		urlParams.push(`duration=${duration}`);
	}

	// Modified element parameters handling
	if (elementValues && elementValues.length > 0) {
		const elementParams = elementValues
			.map(({ elementName, value }) => {
				if (!elementName || !value) return '';
				if (typeof value === 'string') {
					if (elementName.includes('.color')) {
						value = value.startsWith('#') ? value : '#' + value;
					}
					return `${elementName}=${encodeURIComponent(value)}`;
				}
				return '';
			})
			.filter(Boolean);
		urlParams.push(...elementParams);
	}

	// Add parameters to URL if any exist
	if (urlParams.length) {
		url += '&' + urlParams.join('&');
	}

	// console.log('Final URL:', url);

	const credentials = await this.getCredentials('robollyApi');
	const apiToken = credentials?.apikey as string;

	const response = await axios({
		method: 'GET',
		url: url,
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
		responseType: 'arraybuffer',
	});

	let binaryData = await this.helpers.prepareBinaryData(Buffer.from(response.data), videoFormat.substring(1));

	let responseData = {
		json: {
			success: true,
			format: videoFormat,
			size: response.data.length,
			url: url,
		},
		binary: {
			data: binaryData,
		},
	};

	// If GIF format was selected, convert MP4 to GIF
	if (videoFormat === '.gif') {
		const videoBuffer = Buffer.from(response.data);
		const { responseData: gifResponse } = await mp4ToGifWithCompression.call(this, videoBuffer, url);
		responseData = gifResponse;
	}

	return responseData;
}

export async function mp4ToGifWithCompression(this: IExecuteFunctions, videoBuffer: Buffer, url: string): Promise<{ binaryData: IBinaryData; responseData: any }> {
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
				.output(tmpOutputPath)
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});

		// Read the output GIF back into a buffer
		const gifBuffer = fs.readFileSync(tmpOutputPath);

		// Prepare the binary data (n8n-specific helper)
		const binaryData = await this.helpers.prepareBinaryData(gifBuffer, 'gif');

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
