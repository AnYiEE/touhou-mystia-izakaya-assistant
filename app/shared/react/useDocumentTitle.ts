import { useEffect } from 'react';

import { isLocalePrefixSegment } from '@/shared/i18n/routeLocales';

export function useDocumentTitle(title: string, pathnamePrefix?: string) {
	useEffect(() => {
		const [, prefix = '', ...segments] = location.pathname.split('/');
		const pathname = isLocalePrefixSegment(prefix)
			? `/${segments.join('/')}`
			: location.pathname;
		if (
			pathnamePrefix !== undefined &&
			!pathname.startsWith(pathnamePrefix)
		) {
			return;
		}

		const setExpectedTitle = () => {
			if (document.title.trim() !== title) {
				document.title = title;
			}
		};

		const observer = new MutationObserver(setExpectedTitle);

		setExpectedTitle();
		// Next's streamed metadata may keep the title in the body.
		observer.observe(document.documentElement, {
			characterData: true,
			childList: true,
			subtree: true,
		});

		return () => {
			observer.disconnect();
		};
	}, [pathnamePrefix, title]);
}
