export function generateRangeArray(start: number, end: number) {
	return Array.from({length: end - start + 1}, (_, index) => index + start);
}
