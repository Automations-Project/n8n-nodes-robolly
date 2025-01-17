import { IExecuteFunctions, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { genericHttpRequest, RobollyResponse } from '../../GenericFunctions';
import axios from 'axios';
import { mp4ToAV1WithCompression, mp4ToGifWithCompression, mp4ToH264WithCompression, mp4ToHEVCWithCompression, mp4ToVP9WithCompression, mp4ToWebMWithCompression, mp4ToWebPWithCompression } from './ffmpegMethods';
import { imageToWebP, imageToAVIF, imageToTIFF, imageToRaw } from './sharpMethods';
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
	let templateId = null;
	try {
		let currentoperation = this.getNodeParameter('operation') as string;

		if (currentoperation === 'getTemplateElements') templateId = this.getNodeParameter('templateId') as string;
		else if (currentoperation === 'generateImage') templateId = this.getNodeParameter('imageTemplate') as string;
		else if (currentoperation === 'generateVideo') templateId = this.getNodeParameter('videoTemplate') as string;

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

export async function handleGetTemplates(this: IExecuteFunctions) {
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

export async function handleGetRenders(this: IExecuteFunctions) {
	const response = (await genericHttpRequest.call(this, 'GET', `/v1/renders`, {})) as RobollyResponse;

	return response;
}

export async function handleGetTemplateElements(this: IExecuteFunctions) {
	const templateId = this.getNodeParameter('templateId', 0) as string;
	const responseData = (await genericHttpRequest.call(this, 'GET', `/v1/templates/${templateId}/accepted-modifications`, {})) as RobollyResponse;

	return responseData;
}

export async function handleGenerateImage(this: IExecuteFunctions) {
	const imageTemplate = this.getNodeParameter('imageTemplate', 0) as string;
	const convertToIMG = this.getNodeParameter('convertToIMG', 0) as string;
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
	if (convertToIMG !== '' && convertToIMG !== '.png') {
		const extentionOutput = this.getNodeParameter('extentionOutput', 0) as string;
		const imageBuffer = Buffer.from(response.data);
		const result = await ImageExtentionConvertor.call(
			this,
			imageBuffer,
			url,
			convertToIMG,
			// Use the provided extension output or fallback to the conversion format
			extentionOutput || convertToIMG,
		);
		if (result) {
			// Update both the binary data and the response data
			responseData = {
				...result.responseData,
				binary: {
					data: result.binaryData,
				},
			};
		}
	}

	return responseData;
}
export async function handleGenerateVideo(this: IExecuteFunctions) {
	const videoTemplate = this.getNodeParameter('videoTemplate', 0) as string;
	// console.log('templateId:', templateId);

	const videoFormat = this.getNodeParameter('videoFormat', 0) as string;
	const convertToVideo = this.getNodeParameter('convertToVideo', 0) as string;
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
	if (convertToVideo !== '' && convertToVideo !== '.mp4') {
		const extentionOutput = this.getNodeParameter('extentionOutput', 0) as string;
		const videoBuffer = Buffer.from(response.data);
		const { responseData: gifResponse } = await VideoExtentionConvertor.call(this, videoBuffer, url, convertToVideo, extentionOutput);
		responseData = gifResponse;
	}

	return responseData;
}

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
