import { IExecuteFunctions, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { genericHttpRequest, RobollyResponse } from '../../GenericFunctions';
import { VideoExtentionConvertor, ImageExtentionConvertor, calculateTotalDuration } from './extentionConvetor';

export async function getTemplatesid(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const operation = this.getNodeParameter('operation') as string;
		const returnAllItems = this.getNodeParameter('returnAllItems', 0) as boolean;
		const limitItems = returnAllItems ? '' : (this.getNodeParameter('limitItems', 0) as string);

		let allTemplates: INodePropertyOptions[] = [];
		let hasMore = true;
		let cursor: string | undefined;
		const limit = returnAllItems ? undefined : parseInt(limitItems, 10);

		let pageCount = 0;
		while (hasMore && pageCount < 100) {
			pageCount++;

			const params: Record<string, string> = {
				limit: '100',
			};
			if (cursor) {
				params.paginationCursorNext = cursor;
			}

			const response = (await genericHttpRequest.call(this, 'GET', '/v1/templates', { params })) as RobollyResponse;

			if (!response?.templates || !Array.isArray(response.templates)) {
				throw new Error('Invalid response format');
			}

			const filteredTemplates = operation === 'generateVideo' ? response.templates.filter((template: any) => template.transition !== null) : response.templates;

			const templateOptions = filteredTemplates.map((template: any) => ({
				name: template.name || 'Unnamed Template',
				value: template.id,
				description: `Template ID: ${template.id}`,
			}));

			allTemplates = [...allTemplates, ...templateOptions];

			if (limit && allTemplates.length >= limit) {
				allTemplates = allTemplates.slice(0, limit);
				break;
			}

			hasMore = Boolean(response.hasMore);
			cursor = response.paginationCursorNext;

			if (!hasMore || !cursor) {
				break;
			}
		}

		allTemplates = allTemplates.map((template) => ({
			...template,
			description: `Template ID: ${template.value}`,
		}));

		return allTemplates;
	} catch (error) {
		this.logger.error('Error loading templates:', error);
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

		response.acceptedModifications.forEach((item: any) => {
			if (item.elementType !== 'rect') {
				options.push({
					name: item.key,
					value: item.key,
					description: `${item.elementType} type: ${item.type}`,
				});
			}
		});

		response.acceptedModifications.forEach((item: any) => {
			if (item.elementType === 'text') {
				options.push({
					name: `${item.key} (Text Color)`,
					value: `${item.key}.textColor`,
					description: 'Text color property',
				});
			}
		});

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
		this.logger.error('Error in getTemplateElements:', error);
		return options;
	}
}

export async function handleGetTemplates(this: IExecuteFunctions, itemIndex = 0) {
	const templatesType = this.getNodeParameter('templatesType', itemIndex) as string;
	const returnAllItems = this.getNodeParameter('returnAllItems', itemIndex) as boolean;
	const limitItems = returnAllItems ? '' : (this.getNodeParameter('limitItems', itemIndex) as string);

	let allTemplates: any[] = [];
	let hasMore = true;
	let cursor: string | undefined;
	const limit = returnAllItems ? undefined : parseInt(limitItems, 10);

	try {
		let pageCount = 0;
		while (hasMore && pageCount < 100) {
			pageCount++;

			const params: Record<string, string> = {
				limit: '100',
			};
			if (cursor) {
				params.paginationCursorNext = cursor;
			}

			const response = (await genericHttpRequest.call(this, 'GET', `/v1/templates`, { params })) as RobollyResponse;

			if (!response?.templates) {
				break;
			}

			let filteredTemplates = response.templates;
			if (templatesType !== 'all') {
				filteredTemplates = response.templates.filter((template: any) => {
					if (templatesType === 'image') {
						return template.transition === null;
					}
					if (templatesType === 'video') {
						return template.transition !== null;
					}
					return true;
				});
			}

			filteredTemplates.forEach((template) => allTemplates.push(template));

			if (limit && allTemplates.length >= limit) {
				allTemplates = allTemplates.slice(0, limit);
				break;
			}

			hasMore = Boolean(response.hasMore);
			cursor = response.paginationCursorNext;

			if (!hasMore || !cursor) {
				break;
			}
		}

		return this.helpers.returnJsonArray(allTemplates);
	} catch (error) {
		this.logger.error('Error fetching templates:', error);
		throw error;
	}
}

export async function handleGetRenders(this: IExecuteFunctions, itemIndex = 0) {
	const returnAllItems = this.getNodeParameter('returnAllItems', itemIndex) as boolean;
	const limitItems = returnAllItems ? '' : (this.getNodeParameter('limitItems', itemIndex) as string);

	let allRenders: any[] = [];
	let hasMore = true;
	let cursor: string | undefined;
	const limit = returnAllItems ? undefined : parseInt(limitItems, 10);

	try {
		let pageCount = 0;
		while (hasMore && pageCount < 100) {
			pageCount++;

			const params: Record<string, string> = {
				limit: '100',
			};
			if (cursor) {
				params.paginationCursorNext = cursor;
			}

			const response = (await genericHttpRequest.call(this, 'GET', `/v1/renders`, { params })) as RobollyResponse;

			if (!response?.value) {
				break;
			}

			allRenders = [...allRenders, ...response.value];

			if (limit && allRenders.length >= limit) {
				allRenders = allRenders.slice(0, limit);
				break;
			}

			hasMore = Boolean(response.hasMore);
			cursor = response.paginationCursorNext;

			if (!hasMore || !cursor) {
				break;
			}
		}

		return this.helpers.returnJsonArray(allRenders);
	} catch (error) {
		throw error;
	}
}

export async function handleGetTemplateElements(this: IExecuteFunctions, itemIndex = 0) {
	const templateId = this.getNodeParameter('templateId', itemIndex) as string;
	const responseData = (await genericHttpRequest.call(this, 'GET', `/v1/templates/${templateId}/accepted-modifications`, {})) as RobollyResponse;

	return responseData;
}

export async function handleGenerateImage(this: IExecuteFunctions, itemIndex = 0) {
	const imageTemplate = this.getNodeParameter('imageTemplate', itemIndex, '') as string;
	const convertToIMG = this.getNodeParameter('convertToIMG', itemIndex, '') as string;
	const renderLink = this.getNodeParameter('renderLink', itemIndex, false) as boolean;
	let imageFormat = this.getNodeParameter('imageFormat', itemIndex, '') as string;
	const ImageScale = this.getNodeParameter('ImageScale', itemIndex, '1') as string;
	const generateLinkOnly = this.getNodeParameter('generateLinkOnly', itemIndex, false) as boolean;

	const elements = this.getNodeParameter('elementsImage', itemIndex) as {
		ElementValues?: Array<{
			elementNameImage: string;
			valueImage: string;
		}>;
	};

	const elementValues = elements.ElementValues || [];

	let url;
	if (renderLink) {
		const queryParams: Record<string, string> = {
			template: imageTemplate,
			scale: ImageScale,
		};

		elementValues.forEach(({ elementNameImage, valueImage }) => {
			if (elementNameImage && valueImage) {
				if (elementNameImage.includes('.color')) {
					queryParams[elementNameImage] = valueImage.startsWith('#') ? valueImage : '#' + valueImage;
				} else {
					queryParams[elementNameImage] = valueImage;
				}
			}
		});

		const query = new URLSearchParams(queryParams);
		const encoded = Buffer.from(query.toString(), 'utf8').toString('base64url');

		url = `https://api.robolly.com/rd/${encoded}${imageFormat}`;
	} else {
		url = `https://api.robolly.com/templates/${imageTemplate}/render${imageFormat}?scale=${ImageScale}`;
		const urlParams: string[] = [];

		if (elementValues && elementValues.length > 0) {
			const elementParams = elementValues
				.map(({ elementNameImage, valueImage }) => {
					if (!elementNameImage || !valueImage) return '';
					if (typeof valueImage === 'string') {
						if (elementNameImage.includes('.color')) {
							valueImage = valueImage.startsWith('#') ? valueImage : '#' + valueImage;
						}
						return `${elementNameImage}=${encodeURIComponent(valueImage)}`;
					}
					return '';
				})
				.filter(Boolean);
			urlParams.push(...elementParams);
		}

		if (urlParams.length) {
			url += '&' + urlParams.join('&');
		}
	}
	if (generateLinkOnly) {
		return { url: url };
	}

	const credentials = await this.getCredentials('robollyApi');
	const apiToken = credentials?.apikey as string;

	const response = await this.helpers.httpRequest({
		method: 'GET',
		url: url,
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
		json: false,
		returnFullResponse: true,
		encoding: 'arraybuffer' as any,
	});

	const fileExtension = imageFormat.startsWith('.') ? imageFormat.substring(1) : imageFormat;

	let binaryData = await this.helpers.prepareBinaryData(Buffer.from(response.body), `robolly-image${imageFormat}`, `image/${fileExtension}`);

	if (convertToIMG !== '' && convertToIMG !== '.png') {
		const extentionOutput = this.getNodeParameter('extentionOutput', itemIndex) as string;
		const imageBuffer = Buffer.from(response.body);
		const result = await ImageExtentionConvertor.call(
			this,
			imageBuffer,
			url,
			convertToIMG,
			extentionOutput || convertToIMG,
		);
		if (result) {
			return [
				{
					json: {
						success: true,
						url,
					},
					binary: {
						data: result.binaryData,
					},
				},
			];
		}
	}

	return [
		{
			json: {
				success: true,
				url,
			},
			binary: {
				data: binaryData,
			},
		},
	];
}

export async function handleGenerateVideo(this: IExecuteFunctions, itemIndex = 0) {
	const credentials = await this.getCredentials('robollyApi');
	const apiToken = credentials?.apikey as string;
	const MovieGeneration = this.getNodeParameter('movieGeneration', itemIndex) as boolean;
	const videoTemplate = !MovieGeneration ? (this.getNodeParameter('videoTemplate', itemIndex) as string) : '';
	const videoFormat = !MovieGeneration ? (this.getNodeParameter('videoFormat', itemIndex) as string) : '';
	const convertToVideo = !MovieGeneration ? (this.getNodeParameter('convertToVideo', itemIndex) as string) : '';
	const renderLink = !MovieGeneration ? (this.getNodeParameter('renderLink', itemIndex) as boolean) : false;
	let duration = !MovieGeneration ? (this.getNodeParameter('duration', itemIndex, 0) as number) : 0;
	const ApiIntergation = MovieGeneration ? (this.getNodeParameter('ApiIntergation', itemIndex, {}) as JSON) : {};
	const fps = this.getNodeParameter('fps', itemIndex, 30) as number;
	const elements = !MovieGeneration
		? (this.getNodeParameter('elementsVideo', itemIndex) as {
				ElementValues?: Array<{
					elementNameVideo: string;
					valueVideo: string;
				}>;
		  })
		: { ElementValues: [] };
	const elementValues = elements.ElementValues || [];

	let url: string | undefined;
	if (!MovieGeneration && renderLink) {
		const queryParams: Record<string, string> = {
			template: videoTemplate,
			fps: fps.toString(),
		};

		if (duration) {
			queryParams.duration = (duration * 1000).toString();
		}

		elementValues.forEach(({ elementNameVideo, valueVideo }) => {
			if (elementNameVideo && valueVideo) {
				if (elementNameVideo.includes('.color')) {
					queryParams[elementNameVideo] = valueVideo.startsWith('#') ? valueVideo : '#' + valueVideo;
				} else {
					queryParams[elementNameVideo] = valueVideo;
				}
			}
		});

		const query = new URLSearchParams(queryParams);
		const encoded = Buffer.from(query.toString(), 'utf8').toString('base64url');
		url = `https://api.robolly.com/rd/${encoded}.mp4`;
	} else if (!MovieGeneration) {
		url = `https://api.robolly.com/templates/${videoTemplate}/render.mp4`;
		const urlParams: string[] = [];

		if (duration) {
			duration = duration * 1000;
			urlParams.push(`duration=${duration}`);
		}
		urlParams.push(`fps=${fps}`);

		if (elementValues && elementValues.length > 0) {
			const elementParams = elementValues
				.map(({ elementNameVideo, valueVideo }) => {
					if (!elementNameVideo || !valueVideo) return '';
					if (typeof valueVideo === 'string') {
						if (elementNameVideo.includes('.color')) {
							valueVideo = valueVideo.startsWith('#') ? valueVideo : '#' + valueVideo;
						}
						return `${elementNameVideo}=${encodeURIComponent(valueVideo)}`;
					}
					return '';
				})
				.filter(Boolean);
			urlParams.push(...elementParams);
		}

		if (urlParams.length) {
			url += '?' + urlParams.join('&');
		}
	}

	let response = null;
	if (MovieGeneration) {
		const maxAttempts = this.getNodeParameter('attempts', itemIndex, 1) as number;
		return await handleMovieGenerateRequest.call(this, apiToken, ApiIntergation, maxAttempts);
	} else {
		if (!url) {
			throw new Error('URL is required for video generation');
		}
		
		const initialResponse = await this.helpers.request({
			method: 'GET',
			uri: url,
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
			followRedirect: false,
			resolveWithFullResponse: true,
			simple: false,
		});

		// Follow redirect without auth headers to avoid auth errors with S3
		if (initialResponse.statusCode >= 300 && initialResponse.statusCode < 400 && initialResponse.headers.location) {
			response = await this.helpers.request({
				method: 'GET',
				uri: initialResponse.headers.location,
				encoding: null,
				resolveWithFullResponse: true,
			});
		} else {
			response = initialResponse;
		}
	}

	const fileExtension = videoFormat.startsWith('.') ? videoFormat.substring(1) : videoFormat;
	let binaryData = await this.helpers.prepareBinaryData(Buffer.from(response.body), `robolly-video${videoFormat}`, `video/${fileExtension}`);

	let responseData = {
		json: {
			success: true,
			url: url || '',
		},
		binary: {
			data: binaryData,
		},
	};

	if (convertToVideo !== '' && convertToVideo !== '.mp4') {
		const extentionOutput = this.getNodeParameter('extentionOutput', itemIndex) as string;
		const videoBuffer = Buffer.from(response?.body || '');
		const { responseData: gifResponse } = await VideoExtentionConvertor.call(this, videoBuffer, url || '', convertToVideo, extentionOutput);
		responseData = gifResponse;
	}

	return [responseData];
}

async function handleMovieGenerateRequest(this: IExecuteFunctions, apiToken: string, ApiIntergation: any, attempts: number) {
	const jsonObject = typeof ApiIntergation === 'string' ? JSON.parse(ApiIntergation) : ApiIntergation;
	const totalDuration = calculateTotalDuration(jsonObject) * 2;

	let initialResponse = null;
	for (let i = 0; i < 3; i++) {
		try {
			initialResponse = await this.helpers.httpRequest({
				method: 'POST',
				url: 'https://api.robolly.com/v1/video/render',
				headers: {
					Authorization: `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				body: ApiIntergation,
				json: true,
				timeout: 10000,
			});
			break;
		} catch (error) {
			if (i === 2) {
				throw new Error(`Failed to initiate video generation after 3 attempts: ${error.message}`);
			}
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	const resourceUrl = initialResponse?.resourceUrl;
	if (!resourceUrl) {
		throw new Error('Failed to get resource URL from response');
	}

	let currentAttempts = 0;
	while (currentAttempts < attempts) {
		try {
			const pollResponse = await this.helpers.httpRequest({
				method: 'GET',
				url: resourceUrl,
				headers: {
					Authorization: `Bearer ${apiToken}`,
				},
				json: true,
				timeout: 15000,
			});

			if (pollResponse?.value?.[0]?.file) {
				return {
					json: {
						success: true,
						videoUrl: pollResponse.value[0].file,
						status: 'completed',
					},
				};
			}
		} catch (error) {
			this.logger.info(`Poll attempt ${currentAttempts + 1} failed:`, error.message);
		}

		const timeoutDuration = Math.min(Math.max(totalDuration || 15000, 15000), 200000);
		await new Promise((resolve) => setTimeout(resolve, timeoutDuration));
		currentAttempts++;
	}

	throw new Error('Movie generation timed out or failed');
}