import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class robollyApi implements ICredentialType {
	name = 'robollyApi';
	displayName = 'Robolly API';
	documentationUrl = 'https://robolly.com/docs/api-reference/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apikey',
			type: 'string',
			required: true,
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apikey}}',
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		},
	};
}
