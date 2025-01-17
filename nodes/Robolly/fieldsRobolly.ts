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
	{
		displayName: 'Change Encoding',
		name: 'convertToIMG',
		type: 'options',
		options: [
			{ name: 'None', value: '', description: 'No conversion' },
			{ name: 'WebP', value: '.webp', description: 'Modern image format with excellent compression' },
			{ name: 'AVIF', value: '.avif', description: 'Next-gen image format with superior compression' },
			{ name: 'TIFF', value: '.tiff', description: 'High-quality lossless image format' },
			{ name: 'RAW', value: '.raw', description: 'Unprocessed image data format' },
		],
		displayOptions: {
			show: {
				operation: ['generateImage'],
			},
		},
		default: '',
		description: 'Convert the image to the desired format',
	},
	{
		displayName: 'Change File Extension',
		name: 'extentionOutput',
		type: 'options',
		options: [
			{
				name: 'Same as Change Encoding',
				value: '',
			},
			{ name: 'PNG', value: 'png' },
			{ name: 'JPEG', value: 'jpeg' },
		],
		displayOptions: {
			show: {
				operation: ['generateImage'],
				convertToIMG: ['.webp', '.avif', '.tiff', '.raw'],
			},
		},
		default: '',
		description: 'Whether to optimize the converted image for better quality/size ratio',
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
		options: [{ name: 'MP4', value: '.mp4', description: 'Mp4 takes 150 credits to be generated' }],
		displayOptions: {
			show: {
				operation: ['generateVideo'],
			},
		},
		default: '.mp4',
	},

	{
		displayName: 'Change Encoding',
		name: 'convertToVideo',
		type: 'options',

		options: [
			{ name: 'None', value: '', description: 'No conversion' },
			{ name: '📹 AV1', value: '.av1', description: '🥇 High-efficiency video codec with excellent compression' },
			{ name: '🎥 WebP', value: '.webp', description: '🥈 Animation format with efficient compression' },
			{ name: '🎥 WebM', value: '.webm', description: '🥉 Video format with efficient compression' },
			{ name: '🎥 GIF', value: '.gif', description: '🥉 Animation format with wide compatibility' },
			{ name: '📹 H.264 (AVC)', value: '.h264', description: '🥉 Widely supported video codec with good compression' },
			{ name: '📹 HEVC (H.265)', value: '.hevc', description: '🥉 High-efficiency video coding with improved compression' },
			{ name: '📹 VP9', value: '.vp9', description: '🥉 Open-source video codec with efficient compression' },
		],
		displayOptions: {
			show: {
				operation: ['generateVideo'],
			},
		},
		default: '',
		description: 'Convert the video Locally',
	},
	{
		displayName: 'Change File Extension',
		name: 'extentionOutput',
		type: 'options',
		options: [
			{
				name: 'Same as Change Encoding',
				value: '',
			},
			{ name: 'MP4', value: 'mp4', description: 'Modern video format with excellent compression' },
		],
		displayOptions: {
			show: {
				operation: ['generateVideo'],
				convertToVideo: ['.av1', '.webp', '.webm', '.gif', '.h264', '.hevc', '.vp9'],
			},
		},
		default: '',
		description: 'Change the file extension of the generated video',
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
