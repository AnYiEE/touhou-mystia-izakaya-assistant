'use client';

import { useEffect } from 'react';

export function useDocumentTitle(title: string, pathnamePrefix?: string) {
	useEffect(() => {
		if (
			pathnamePrefix !== undefined &&
			!globalThis.location.pathname.startsWith(pathnamePrefix)
		) {
			return;
		}

		const observer = new MutationObserver((_, ob) => {
			if (document.title.trim() !== title) {
				document.title = title;
				ob.disconnect();
			}
		});

		document.title = title;
		observer.observe(document.head, { childList: true });

		return () => {
			observer.disconnect();
		};
	}, [pathnamePrefix, title]);
}
