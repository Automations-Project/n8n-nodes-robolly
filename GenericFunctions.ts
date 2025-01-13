import { IExecuteFunctions, IHttpRequestMethods, ILoadOptionsFunctions } from 'n8n-workflow';

interface RequestOptions {
	method?: 'GET' | 'POST';
	headers?: HeadersInit;
	body?: any;
	params?: Record<string, string>;
	// true for render endpoints, false for classic API
}

export interface RobollyResponse {
	acceptedModifications?: Array<{
		elementType: string;
		key: string;
		type: string;
	}>;
	templates?: Array<{
		id: string;
		name: string;
	}>;
}

export async function genericHttpRequest<T = RobollyResponse>(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	options: RequestOptions = {},
): Promise<T> {
	try {
		const credentials = await this.getCredentials('robollyApi');
		const apiToken = credentials?.apikey as string;

		// Determine the base URL based on endPointType
		const fullEndpoint = `https://api.robolly.com${endpoint}`;

		const response = await this.helpers.httpRequest({
			method,
			url: fullEndpoint,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiToken}`,
				...options.headers,
			},
			body: options.body,
			json: true,
		});
		return response as T;
	} catch (error) {
		console.error('Request failed:', error);
		throw error;
	}
}
