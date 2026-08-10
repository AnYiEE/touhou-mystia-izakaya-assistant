import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';

export function downloadJson(
	fileName: string,
	jsonString: string,
	extension?: string
) {
	const blob = new Blob([jsonString], { type: FILE_TYPE_JSON });
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

export async function parseJsonFromInput(input: HTMLInputElement) {
	if (input.files === null) {
		return null;
	}

	const {
		files: [file],
	} = input;

	if (file === undefined) {
		return null;
	}

	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener('error', () => {
			reject(reader.error ?? new Error('file-read-failed'));
		});
		reader.addEventListener('load', () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
				return;
			}
			reject(new Error('file-read-failed'));
		});
		// eslint-disable-next-line unicorn/prefer-blob-reading-methods -- Safari 12 lacks Blob.text(), which core-js cannot polyfill.
		reader.readAsText(file);
	});
}
