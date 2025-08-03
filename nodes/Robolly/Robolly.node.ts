import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData, IDataObject, NodeConnectionType } from 'n8n-workflow';
import { operatorRobolly } from './operators';
import { getTemplateElementsOptions, getTemplatesid } from './methods';
import { executeRobolly } from './execute';
import { generateImageFields, generateVideoFields, getTemplatesFields, publicFields } from './fields';
export class Robolly implements INodeType {
	public async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const responseData = await executeRobolly.call(this, operation, i);

			if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].hasOwnProperty('json')) {
				for (const item of responseData as INodeExecutionData[]) {
					returnData.push({
						...item,
						pairedItem: { item: i }
					});
				}
			} else {
				returnData.push({
					json: responseData as unknown as IDataObject,
					pairedItem: { item: i }
				});
			}
		}

		return [returnData];
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
