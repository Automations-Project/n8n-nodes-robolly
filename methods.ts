import { ILoadOptionsFunctions, INodePropertyOptions, IExecuteFunctions } from 'n8n-workflow';
import axios from 'axios';
import { Buffer } from 'buffer';

export async function getAllTemplatesid(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const credentials = await this.getCredentials('robollyApi');
		const apiToken = credentials?.apikey as string;

		const response = await this.helpers.request({
			method: 'GET',
			url: 'https://api.robolly.com/v1/templates',
			headers: {
				'Authorization': `Bearer ${apiToken}`,
				'Content-Type': 'application/json',
			},
			json: true,
		});

		if (!response || !response.templates || !Array.isArray(response.templates)) {
			throw new Error('Invalid response format');
		}

		return response.templates.map((template: any) => ({
			name: template.name || 'Unnamed Template',
			value: template.id,
			description: `Template ID: ${template.id}`,
		}));
	} catch (error) {
		console.error('Error loading templates:', error);
		return [];
	}
}

export async function getAllTemplateElements(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const credentials = await this.getCredentials('robollyApi');
		const apiToken = credentials?.apikey as string;
		const templateId = this.getNodeParameter('templateId') as string;

		if (!templateId) {
			return [];
		}

		const response = await this.helpers.request({
			method: 'GET',
			url: `https://api.robolly.com/v1/templates/${templateId}/accepted-modifications`,
			headers: {
				'Authorization': `Bearer ${apiToken}`,
				'Content-Type': 'application/json',
			},
			json: true,
		});

		if (!response?.acceptedModifications) {
			return [];
		}

		const options: INodePropertyOptions[] = [];

		for (const item of response.acceptedModifications) {
			if(item.elementType !== 'rect'){
			options.push({
				name: item.key,
				value: item.key,
				description: `Type: ${item.type} Element: ${item.elementType}`,
			});
		}

			if (['text'].includes(item.elementType)) {
				options.push({
					name: `${item.key} Color`,
					value: `${item.key}.textColor`,
					description: `Color property for ${item.key}`,
				});
			}

			if (['rect'].includes(item.elementType)) {
				options.push({
					name: `${item.key} Color`,
					value: `${item.key}.background.color`,
					description: `Color property for ${item.key}`,
				});
			}
		}

		return options;
	} catch (error) {
		console.error('Error loading template elements:', error);
		return [];
	}
}

export async function executeRobolly(
	this: IExecuteFunctions,
	operation: string,
	apiToken: string,
): Promise<any> {
	try {
		if (operation === 'getAllTemplates') {
			const response = await this.helpers.request({
				method: 'GET',
				url: 'https://api.robolly.com/v1/templates',
				headers: {
					'Authorization': `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				json: true,
			});
			return response;
		} else if (operation === 'getTemplateElements') {
			const templateId = this.getNodeParameter('templateId', 0) as string;
			const responseData = await this.helpers.request({
				method: 'GET',
				url: `https://api.robolly.com/v1/templates/${templateId}/accepted-modifications`,
				headers: {
					'Authorization': `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				json: true,
			});
			return responseData;
		} else if (operation === 'generateImage') {
			const templateId = this.getNodeParameter('templateId', 0) as string;
			const imageFormat = this.getNodeParameter('imageFormat', 0) as string;
			const elements = this.getNodeParameter('elements.elementValues', 0, []) as Array<{
				elementName: string;
				value: string;
			}>;
			const imageQuality = this.getNodeParameter('imageQuality', 0) as string;

			let url = `https://api.robolly.com/templates/${templateId}/render${imageFormat}?scale=${imageQuality}`;
			
			const params = elements.map(({ elementName, value }) => {
				if (typeof value === 'string') {
					if (elementName.includes('.color')) {
						value = value.startsWith('#') ? value : '#' + value;
					}
					return `${elementName}=${encodeURIComponent(value)}`;
				}
				return '';
			}).filter(param => param !== '');
			
			if (params.length) {
				url += '&' + params.join('&');
			}

		//	console.log('Final URL:', url);

			const response = await axios({
				method: 'GET',
				url: url,
				headers: {
					'Authorization': `Bearer ${apiToken}`,
				},
				responseType: 'arraybuffer'
			});

			const binaryData = await this.helpers.prepareBinaryData(
				Buffer.from(response.data),
				imageFormat.substring(1)
			);

			return {
				json: {
					success: true,
					format: imageFormat,
					size: response.data.length,
					url: url
				},
				binary: {
					data: binaryData,
				},
			};
		}

		return null;
	} catch (error) {
		if (error.response) {
			throw new Error(`Robolly API error: ${error.response?.data?.message || error.message}`);
		}
		throw error;
	}
}

export async function getTemplateElements(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const options: INodePropertyOptions[] = [];

	try {
		const credentials = await this.getCredentials('robollyApi');
		const templateId = this.getNodeParameter('templateId') as string;

		const response = await this.helpers.request({
			method: 'GET',
			url: `https://api.robolly.com/v1/templates/${templateId}/accepted-modifications`,
			headers: {
				Authorization: `Bearer ${credentials.apikey}`,
				'Content-Type': 'application/json',
			},
			json: true,
		});

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
