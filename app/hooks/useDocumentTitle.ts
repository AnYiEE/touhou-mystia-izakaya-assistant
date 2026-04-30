import { useEffect } from 'react';

export function useDocumentTitle(title: string, pathnamePrefix?: string) {
	useEffect(() => {
		if (
			pathnamePrefix !== undefined &&
			!location.pathname.startsWith(pathnamePrefix)
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
		observer.observe(document.head, {
			characterData: true,
			childList: true,
			subtree: true,
		});

		return () => {
			observer.disconnect();
		};
	}, [pathnamePrefix, title]);
}
