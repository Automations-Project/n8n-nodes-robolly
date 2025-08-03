import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { handleGenerateImage, handleGenerateVideo, handleGetTemplates, handleGetTemplateElements, handleGetRenders } from './methods';

export async function executeRobolly(this: IExecuteFunctions, operation: string, itemIndex = 0) {
	switch (operation) {
		case 'getTemplates':
			return handleGetTemplates.call(this, itemIndex);
		case 'getTemplateElements':
			return handleGetTemplateElements.call(this, itemIndex);
		case 'generateImage':
			return handleGenerateImage.call(this, itemIndex);
		case 'generateVideo':
			return handleGenerateVideo.call(this, itemIndex);
		case 'getRenders':
			return handleGetRenders.call(this, itemIndex);
		default:
			throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`);
	}
}
