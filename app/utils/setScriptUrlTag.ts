import {Observable} from 'rxjs';

export function setScriptUrlTag(url: string, method?: 'async' | 'defer', crossOrigin?: boolean) {
	return new Observable<boolean>((subscriber) => {
		if (!url) {
			subscriber.error(false);
			return;
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
			subscriber.next(true);
			subscriber.complete();
		});
		scriptElement.addEventListener('error', () => {
			subscriber.error(false);
		});

		document.head.append(scriptElement);

		return () => {
			scriptElement.remove();
		};
	});
}
