/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
export function setScriptUrlTag(url: string, method?: 'async' | 'defer', crossOrigin?: boolean) {
	return new Promise<boolean>((resolve, reject) => {
		if (!url) {
			reject(false);
		}

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
			resolve(true);
		});
		scriptElement.addEventListener('error', () => {
			reject(false);
		});

		document.head.append(scriptElement);
	});
}
