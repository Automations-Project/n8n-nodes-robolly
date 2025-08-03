import { INodeProperties } from 'n8n-workflow';
export const publicFields: INodeProperties[] = [
	// This field appears here due to fields ordering requirements
	{
		displayName: '⚡ Generate Link Only ⚡',
		name: 'generateLinkOnly',
		type: 'boolean',
		default: false,
		description: 'Whether to return only the render link',
		displayOptions: {
			show: {
				operation: ['generateImage'],
			},
		},
	},
	{
		displayName: 'Hidden Render Link',
		name: 'renderLink',
		type: 'boolean',
		default: false,
		description: 'Whether to use Base64 encoding to create a hidden render link',
		displayOptions: {
			show: {
				operation: ['generateVideo', 'generateImage'],
			},
		},
	},
	{
		displayName: 'Movie Generation',
		name: 'movieGeneration',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['generateVideo'],
			},
		},
		default: false,
		// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
		description: 'Manually request Api integration JSON DATA',
	},
	//
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
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Return All Items',
		name: 'returnAllItems',
		type: 'boolean',
		default: true,
		description: 'Whether to get all items of the template',
		displayOptions: {
			show: {
				operation: ['getRenders', 'getTemplates'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limitItems',
		type: 'number',
		default: 1,
		description: 'How many Itmes to return',
		displayOptions: {
			show: {
				operation: ['getRenders', 'getTemplates'],
				returnAllItems: [false],
			},
		},
	},
	{
		displayName: `⚠️ Warning Get Renders may show a huge data ⚠️`,
		name: 'RenderWarning',
		type: 'notice',
		default: '',
		description: '⚠️ Get Renders may show a huge data ⚠️',
		displayOptions: {
			show: {
				operation: ['getRenders'],
				returnAllItems: [true],
			},
		},
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
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Image Format',
		name: 'imageFormat',
		type: 'options',
		options: [
			{ name: 'JPG', value: '.jpg', description: 'Jpg takes 1 credit to generate an image' },
			{ name: 'PNG', value: '.png', description: 'Png takes 3 credits to generate an image' },
		],
		displayOptions: {
			show: {
				operation: ['generateImage'],
			},
		},
		default: '.jpg',
		description: 'Image Format like png/jpg',
	},
	{
		displayName: 'Change Encoding',
		name: 'convertToIMG',
		type: 'options',
		options: [
			{ name: 'None', value: '', description: 'No conversion' },
			{ name: '🖼️ AVIF', value: '.avif', description: '🥇 Next-gen image format with superior compression' },
			{ name: '🖼️ WebP', value: '.webp', description: '🥈 Modern image format with excellent compression' },
			{ name: '🖼️ TIFF', value: '.tiff', description: '🥉 High-quality lossless image format' },
			{ name: '🖼️ RAW', value: '.raw', description: '🥉 Unprocessed image data format' },
		],
		displayOptions: {
			show: {
				operation: ['generateImage'],
				generateLinkOnly: [false],
			},
		},
		default: '',
		description: 'Convert the image to the desired format',
	},
	{
		displayName: 'Image Scale',
		name: 'ImageScale',
		type: 'options',
		options: [
			{
				name: 'Default',
				value: '1',
				description: 'Default Image Scale is 1.0 the size of the template',
			},

			{
				name: 'Low Quality',
				value: '0.5',
				description: 'Low Image Scale is x0.5 the size of the template',
			},
			{
				name: 'High Quality',
				value: '2',
				description: 'High Image Scale is x2 the size of the template',
			},
			{
				name: 'Super High Quality',
				value: '3',
				description: 'Super High Image Scale is x3 the size of the template',
			},
		],
		displayOptions: {
			show: {
				operation: ['generateImage'],
			},
		},
		default: '1',
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
			{ name: 'JPG', value: 'jpg' },
		],
		displayOptions: {
			show: {
				operation: ['generateImage'],
				convertToIMG: ['.webp', '.avif', '.tiff', '.raw'],
				generateLinkOnly: [false],
			},
		},
		default: '',
		description: 'Whether to optimize the converted image for better quality/size ratio',
	},

	{
		displayName: 'Template Elements',
		name: 'elementsImage',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				operation: ['generateImage'],
			},
		},
		options: [
			{
				name: 'ElementValues',
				displayName: 'Element',
				values: [
					{
						displayName: 'Element Name or ID',
						name: 'elementNameImage',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getTemplateElementsOptions',
						},
						default: '',
						description: 'Name of the element to modify. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Value',
						name: 'valueImage',
						type: 'string',
						default: '',
						description: 'Value to set for the element',
					},
				],
			},
		],
	},
];

export const generateVideoFields: INodeProperties[] = [
	{
		displayName: 'Video Template Name or ID',
		name: 'videoTemplate',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplatesid',
		},
		displayOptions: {
			show: {
				operation: ['generateVideo'],
				movieGeneration: [false],
			},
		},
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Video Format',
		name: 'videoFormat',
		type: 'options',
		options: [{ name: 'MP4', value: '.mp4', description: 'Standard video format with wide compatibility and good compression' }],
		displayOptions: {
			show: {
				operation: ['generateVideo'],
				movieGeneration: [false],
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
				movieGeneration: [false],
			},
		},
		default: 5,
		description: 'Duration of the video in seconds',
	},
	{
		displayName: 'FPS',
		name: 'fps',
		type: 'options',
		options: [
			{ name: '24 FPS', value: '24', description: '24 Frames Per Second' },
			{ name: '30 FPS', value: '30', description: '30 Frames Per Second' },
			{ name: '50 FPS', value: '50', description: '50 Frames Per Second' },
			{ name: '60 FPS', value: '60', description: '60 Frames Per Second' },
		],

		displayOptions: {
			show: {
				operation: ['generateVideo'],
				movieGeneration: [false],
			},
		},
		default: '24',
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
				movieGeneration: [false],
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
				movieGeneration: [false],
			},
		},
		default: '',
		description: 'Change the file extension of the generated video',
	},

	{
		displayName: 'JSON Data',
		name: 'ApiIntergation',
		type: 'json',
		placeholder: 'test',
		displayOptions: {
			show: {
				operation: ['generateVideo'],
				movieGeneration: [true],
			},
		},
		default: '{}',
	},
	{
		displayName: 'Attempts',
		name: 'attempts',
		type: 'number',
		default: 5,
		description: 'Number of attempts for requesting resourceURL',
		displayOptions: {
			show: {
				operation: ['generateVideo'],
				movieGeneration: [true],
			},
		},
	},
	{
		displayName: 'Template Elements',
		name: 'elementsVideo',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				operation: ['generateVideo'],

				movieGeneration: [false],
			},
		},
		options: [
			{
				name: 'ElementValues',
				displayName: 'Element',
				values: [
					{
						displayName: 'Element Name or ID',
						name: 'elementNameVideo',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getTemplateElementsOptions',
						},
						default: '',
						description: 'Name of the element to modify. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Value',
						name: 'valueVideo',
						type: 'string',
						default: '',
						description: 'Value to set for the element',
					},
				],
			},
		],
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
