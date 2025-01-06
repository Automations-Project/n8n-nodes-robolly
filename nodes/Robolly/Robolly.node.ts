//@ts-nocheck
import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	IExecuteFunctions,
	INodeExecutionData,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import {
	getAllTemplatesid,
	getAllTemplateElements,
	executeRobolly,
	getTemplateElements,
} from '../../methods';
import ffmpeg from 'fluent-ffmpeg';
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
import { file } from 'tmp-promise';

export class Robolly implements INodeType {
	public async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('robollyApi');
		const apiToken = credentials?.apikey as string;

		let responseData = await executeRobolly.call(this, operation, apiToken);
		console.log('Response structure:', {
			hasData: !!responseData,
			properties: responseData ? Object.keys(responseData) : [],
			binary: responseData?.binary ? Object.keys(responseData.binary) : [],
		});

		// Convert MP4 to GIF if GIF format was selected
		if (operation === 'generateImage') {
			const imageFormat = this.getNodeParameter('imageFormat', 0) as string;

			if (imageFormat === '.gif') {
				if (!responseData?.binary?.data) {
					throw new NodeOperationError(this.getNode(), 'No video data received from Robolly API');
				}

				// Create temporary files for processing
				const { path: tmpInputPath, cleanup: cleanupInput } = await file({ postfix: '.mp4' });
				const { path: tmpOutputPath, cleanup: cleanupOutput } = await file({ postfix: '.gif' });

				try {
					// Write the MP4 buffer to temporary file
					const videoBuffer = Buffer.from(responseData.binary.data.data, 'base64');
					await this.helpers.writeContentToFile(tmpInputPath, videoBuffer);

					// Convert MP4 to GIF using ffmpeg
					await new Promise((resolve, reject) => {
						ffmpeg(tmpInputPath)
							.toFormat('gif')
							.output(tmpOutputPath)
							.on('end', resolve)
							.on('error', reject)
							.run();
					});

					// Read the converted GIF directly using fs
					const fs = require('fs');
					const gifBuffer = fs.readFileSync(tmpOutputPath);

					// Update the response with the GIF data
					responseData.binary.data = {
						mimeType: 'image/gif',
						fileType: 'image',
						fileExtension: 'gif',
						data: gifBuffer.toString('base64'),
						fileName: 'output.gif',
						fileSize: `${gifBuffer.length} B`,
					};

					// Cleanup temporary files
					await cleanupInput();
					await cleanupOutput();
				} catch (error) {
					// Cleanup on error
					await cleanupInput();
					await cleanupOutput();
					throw error;
				}
			}
		}

		return [this.helpers.returnJsonArray([responseData])];
	}

	description: INodeTypeDescription = {
		displayName: 'Robolly',
		name: 'robolly',
		icon: 'file:robolly.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Get Data From Robolly',
		defaults: {
			name: 'Robolly',
		},
		//@ts-ignore
		inputs: ['main'],
		//@ts-ignore
		outputs: ['main'],
		credentials: [
			{
				name: 'robollyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get All Templates',
						value: 'getAllTemplates',
						description: 'Get all templates in your Robolly account',
						action: 'Get all templates',
					},
					{
						name: 'Get Template Elements',
						value: 'getTemplateElements',
						description: 'Get all template elements in your Robolly account',
						action: 'Get all template elements',
					},
					{
						name: 'Generate an Image',
						value: 'generateImage',
					},
				],
				default: 'getAllTemplates',
			},
			{
				displayName: 'Template Name or ID',
				name: 'templateId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAllTemplatesid',
				},
				displayOptions: {
					show: {
						operation: ['getTemplateElements', 'generateImage'],
					},
				},
				default: '',
				description:
					'Get Template ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Image Quality',
				name: 'imageQuality',
				type: 'options',
				options: [
					{ name: 'Default', value: '1', description: 'Defualt size is 1024x1024' },
					{
						name: 'Low Quality',
						value: '0.5',
						description: 'Low Quallity is x0.5 the size of the image',
					},
					{
						name: 'Super Quality',
						value: '2',
						description: 'Super Quallity is x2 the size of the image',
					},
					{
						name: 'Max Quality',
						value: '3',
						description: 'Max Quallity is x3 the size of the image',
					},
				],
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				default: '1',
				description: 'Image Quality like scale=1, scale=0.5, scale=2, scale=3',
			},
			{
				displayName: 'Image Format',
				name: 'imageFormat',
				type: 'options',
				options: [
					{ name: 'Png', value: '.png', description: 'Png takes 3 credits to generate an image' },
					{ name: 'Jpg', value: '.jpg', description: 'Jpg takes 1 credit to generate an image' },
					{
						name: 'Gif',
						value: '.gif',
						description: 'Gif takes 150 credits to be generated',
					},
					{ name: 'Mp4', value: '.mp4', description: 'Mp4 takes 150 credits to be generated' },
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
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['generateImage'],
						imageFormat: ['.mp4', '.gif'],
					},
				},
				default: 5,
				description: 'Duration of the video in seconds',
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
						operation: ['generateImage'],
					},
				},
				options: [
					{
						name: 'elementValues',
						displayName: 'Element',
						values: [
							{
								displayName: 'Element Name or ID',
								name: 'elementName',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getAllTemplateElements',
								},
								default: '',
								description:
									'Name of the element to modify. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		],
	};

	methods = {
		loadOptions: {
			getAllTemplatesid,
			getAllTemplateElements,
			getTemplateElements,
		},
	};
}
