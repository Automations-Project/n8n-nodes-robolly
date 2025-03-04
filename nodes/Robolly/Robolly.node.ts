import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData, IDataObject, NodeConnectionType } from 'n8n-workflow';
import { operatorRobolly } from './operatorsRobolly';
import { getTemplateElementsOptions, getTemplatesid } from './operatorMethods';
import { executeRobolly } from './executeRobolly';
import { generateImageFields, generateVideoFields, getTemplatesFields, publicFields } from './fieldsRobolly';
export class Robolly implements INodeType {
	public async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const responseData = await executeRobolly.call(this, operation);

		if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].hasOwnProperty('json')) {
			return [responseData as INodeExecutionData[]];
		}

		return [[{ json: responseData as IDataObject }]];
	}
	description: INodeTypeDescription = {
		displayName: 'Robolly',
		name: 'robolly',
		icon: 'file:robolly.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Get Data From Robolly',
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		defaults: {
			name: 'Robolly',
		},

		credentials: [
			{
				name: 'robollyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: '<div hidden>🌟 Connect with the community! Join our official <a href="https://www.facebook.com/groups/robolly" target="_blank">Facebook Group</a> or engage in discussions on our unofficial <a href="https://nskha.com/discord" target="_blank">Discord Server</a>. 🚀</div>',
				name: 'tip',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [...operatorRobolly],
				default: '',
			},

			...generateImageFields,
			...generateVideoFields,
			...publicFields,
			...getTemplatesFields,
		],
	};
	methods = {
		loadOptions: {
			getTemplatesid,
			getTemplateElementsOptions,
		},
	};
}
