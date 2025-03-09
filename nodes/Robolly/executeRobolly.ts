import { IExecuteFunctions } from 'n8n-workflow';
import { handleGenerateImage, handleGenerateVideo, handleGetTemplates, handleGetTemplateElements, handleGetRenders } from './operatorMethods';

export async function executeRobolly(this: IExecuteFunctions, operation: string) {
	switch (operation) {
		case 'getTemplates':
			return handleGetTemplates.call(this);
		case 'getTemplateElements':
			return handleGetTemplateElements.call(this);
		case 'generateImage':
			return handleGenerateImage.call(this);
		case 'generateVideo':
			return handleGenerateVideo.call(this);
		case 'getRenders':
			return handleGetRenders.call(this);
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}
