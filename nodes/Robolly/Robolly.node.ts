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
} from 'n8n-workflow';
import { getAllTemplatesid, getAllTemplateElements, executeRobolly, getTemplateElements } from '../../methods';

export class Robolly implements INodeType {
    public async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const operation = this.getNodeParameter('operation', 0) as string;
        const credentials = await this.getCredentials('robollyApi');
        const apiToken = credentials?.apikey as string;

        const responseData = await executeRobolly.call(this, operation, apiToken);
        return [this.helpers.returnJsonArray(responseData)];
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
                        description: 'Get all Templates in your Robolly account',
																								action: 'Get All Templates',
                    },
                    {
                        name: 'Get Template Elements',
                        value: 'getTemplateElements',
                        description: 'Get all Template Elements in your Robolly account',
																								action: 'Get All Template Elements',
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
                description: 'Get Template ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
            },
            {
                displayName: 'Image Quality',
                name: 'imageQuality',
                type: 'options',
                options: [

                    { name: 'Default', value: '1',description:"Defualt size is 1024x1024" },
                    { name: 'Low Quality', value: '0.5',description:"Low Quallity is x0.5 the size of the image" },
                    { name: 'Super Quality', value: '2',description:"Super Quallity is x2 the size of the image" },
                    { name: 'Max Quality', value: '3',description:"Max Quallity is x3 the size of the image" },
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
                    { name: 'Png', value: '.png',description:"Png takes 3 credits to generate an image" },
                    { name: 'Jpg', value: '.jpg',description:"Jpg takes 1 credit to generate an image" },
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
