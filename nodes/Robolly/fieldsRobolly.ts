import { INodeProperties } from 'n8n-workflow';

export const publicFields: INodeProperties[] = [
	{
		displayName: 'Quality',
		name: 'quality',
		type: 'options',
		options: [
			{
				name: 'Default',
				value: '1',
				description: 'Default Quallity is same as the template',
			},

			{
				name: 'Low Quality',
				value: '0.5',
				description: 'Low Quallity is x0.5 the size of the template',
			},
			{
				name: 'High Quality',
				value: '2',
				description: 'High Quallity is x2 the size of the template',
			},
			{
				name: 'Very High Quality',
				value: '3',
				description: 'Very High Quallity is x3 the size of the template',
			},
		],
		displayOptions: {
			show: {
				operation: ['generateImage', 'generateVideo'],
			},
		},
		default: '1',
	},

	{
		displayName: 'Template Elements',
		name: 'elements',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				operation: ['generateImage', 'generateVideo'],
			},
		},
		options: [
			{
				name: 'ElementValues',
				displayName: 'Element',
				values: [
					{
						displayName: 'Element Name or ID',
						name: 'elementName',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getTemplateElementsOptions',
						},
						default: '',
						description: 'Name of the element to modify. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value to set for the element',
					},
				],
			},
		],
	},
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTemplatesid',
		},
		displayOptions: {
			show: {
				operation: ['getTemplateElements'],
			},
		},
		default: '',
		description: 'Get Template ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];

export const generateImageFields: INodeProperties[] = [
	{
		displayName: 'Image Template Name or ID',
		name: 'imageTemplate',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTemplatesid',
		},
		displayOptions: {
			show: {
				operation: ['generateImage'],
			},
		},
		default: '',
		description: 'Get Template ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Image Format',
		name: 'imageFormat',
		type: 'options',
		options: [
			{ name: 'PNG', value: '.png', description: 'Png takes 3 credits to generate an image' },
			{ name: 'JPG', value: '.jpg', description: 'Jpg takes 1 credit to generate an image' },
		],
		displayOptions: {
			show: {
				operation: ['generateImage'],
			},
		},
		default: '.png',
		description: 'Image Format like png/jpg',
	},
];

export const generateVideoFields: INodeProperties[] = [
	{
		displayName: 'Video Template Name or ID',
		name: 'videoTemplate',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTemplatesid',
		},
		displayOptions: {
			show: {
				operation: ['generateVideo'],
			},
		},
		default: '',
		description: 'Get Template ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Video Format',
		name: 'videoFormat',
		type: 'options',
		options: [
			{ name: 'GIF', value: '.gif', description: 'Gif takes 150 credits to be generated' },
			{ name: 'MP4', value: '.mp4', description: 'Mp4 takes 150 credits to be generated' },
		],
		displayOptions: {
			show: {
				operation: ['generateVideo'],
			},
		},
		default: '.mp4',
	},
	{
		displayName: 'Duration',
		name: 'duration',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['generateVideo'],
			},
		},
		default: 5,
		description: 'Duration of the video in seconds',
	},
];

export const getTemplatesFields: INodeProperties[] = [
	{
		displayName: 'Templates Type',
		name: 'templatesType',
		type: 'options',
		options: [
			{
				name: 'All',
				value: 'all',
				description: 'All Types of Templates',
			},
			{
				name: 'Image Only',
				value: 'image',
				description: 'Image type Templates Only',
			},
			{
				name: 'Video Only',
				value: 'video',
				description: 'Video type Templates Only',
			},
		],
		displayOptions: {
			show: {
				operation: ['getTemplates'],
			},
		},
		default: 'all',
		description: 'Type of Templates',
	},
];
