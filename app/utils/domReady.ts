export function domReady() {
	const condition: DocumentReadyState[] = ['complete', 'interactive'];

	const checkReady = () => condition.includes(document.readyState);

	return new Promise<boolean>((resolve) => {
		if (checkReady()) {
			resolve(true);
		} else {
			document.addEventListener('readystatechange', () => {
				if (checkReady()) {
					resolve(true);
				}
			});
		}
	});
}
