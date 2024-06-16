import {useEffect, useState} from 'react';

type Theme = 'dark' | 'light' | 'system';

function useSystemTheme() {
	const [systemTheme, setSystemTheme] = useState<Theme>('system');

	useEffect(() => {
		const mediaQueryList = window.matchMedia('(prefers-color-scheme: light)');

		setSystemTheme(mediaQueryList.matches ? 'light' : 'dark');

		const handleChange = (event: MediaQueryListEvent) => {
			setSystemTheme(event.matches ? 'light' : 'dark');
		};

		mediaQueryList.addEventListener('change', handleChange);

		return () => {
			mediaQueryList.removeEventListener('change', handleChange);
		};
	}, []);

	return systemTheme;
}

export {useSystemTheme};
