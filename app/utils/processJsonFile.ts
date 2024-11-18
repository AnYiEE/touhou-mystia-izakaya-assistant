export const FILE_TYPE_JSON = 'application/json';

export function downloadJson(fileName: string, jsonString: string, extension?: string) {
	const blob = new Blob([jsonString], {
		type: FILE_TYPE_JSON,
	});
	const url = URL.createObjectURL(blob);

	const element = document.createElement('a');
	element.classList.add('hidden');
	element.download = `${fileName}${extension ?? '.json'}`;
	element.href = url;
	document.body.append(element);
	element.click();

	element.remove();
	URL.revokeObjectURL(url);
}

export function parseJsonFromInput(input: HTMLInputElement, callback: (value: string) => void) {
	if (input.files === null) {
		return;
	}

	const {
		files: [file],
	} = input;

	if (file === undefined) {
		return;
	}

	const blob = new Blob([file], {
		type: FILE_TYPE_JSON,
	});

	void blob.text().then(callback);
}
