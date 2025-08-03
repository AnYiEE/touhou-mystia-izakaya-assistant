function cleanup(element: HTMLElement) {
	if (document.head.contains(element)) {
		element.remove();
	}
}

export function setScriptUrlTag(
	url: string,
	method?: 'async' | 'defer',
	crossOrigin?: boolean
) {
	return new Promise<void>((resolve, reject) => {
		const scriptElement = document.createElement('script');
		scriptElement.src = url;

		if (crossOrigin) {
			scriptElement.crossOrigin = 'anonymous';
		}
		if (method === 'async') {
			scriptElement.async = true;
		}
		if (method === 'defer') {
			scriptElement.defer = true;
		}

		scriptElement.addEventListener('load', () => {
			cleanup(scriptElement);
			resolve();
		});

		scriptElement.addEventListener('error', (error) => {
			cleanup(scriptElement);
			// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
			reject(error);
		});

		document.head.append(scriptElement);
	});
}
