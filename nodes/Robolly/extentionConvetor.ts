/**
 * Video and image conversion utilities.
 * Note: Local conversion features (FFmpeg) have been removed for n8n Cloud compatibility.
 * Videos and images are returned in their original format from the Robolly API.
 */

export const calculateTotalDuration = (data: any): number => {
	let total = 0;

	// Check if data has timeline property and it's an array
	if (data?.timeline && Array.isArray(data.timeline)) {
		// Sum up all duration values in timeline
		data.timeline.forEach((item: any) => {
			if (item?.duration && typeof item.duration === 'number') {
				total += item.duration;
			}
		});
	}
	return total;
};
