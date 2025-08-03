import { IExecuteFunctions, IHttpRequestMethods, ILoadOptionsFunctions, NodeApiError } from 'n8n-workflow';

interface RequestOptions {
	method?: 'GET' | 'POST';
	headers?: HeadersInit;
	body?: any;
	params?: Record<string, string>;
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
		transition: {
			duration: number;
		} | null;
	}>;
	value?: Array<any>;
	hasMore?: boolean;
	paginationCursorNext?: string;
}

export async function genericHttpRequest<T = RobollyResponse>(this: IExecuteFunctions | ILoadOptionsFunctions, method: IHttpRequestMethods, endpoint: string, options: RequestOptions = {}): Promise<T> {
	try {
		const credentials = await this.getCredentials('robollyApi');
		const apiToken = credentials?.apikey as string;

		let fullEndpoint = `https://api.robolly.com${endpoint}`;
		if (options.params) {
			const searchParams = new URLSearchParams(options.params);
			fullEndpoint += fullEndpoint.includes('?') ? '&' : '?';
			fullEndpoint += searchParams.toString();
		}

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
		throw new NodeApiError(this.getNode(), error as any);
	}
}
