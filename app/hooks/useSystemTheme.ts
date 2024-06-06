import {useEffect, useState} from 'react';

type Theme = 'dark' | 'light' | 'system';

function useSystemTheme() {
	const [systemTheme, setSystemTheme] = useState<Theme>('system');

	useEffect(() => {
		setSystemTheme(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
	}, []);

	useEffect(() => {
		const query = '(prefers-color-scheme: light)';
		const handleChange = (event: MediaQueryListEvent) => {
			setSystemTheme(event.matches ? 'light' : 'dark');
		};
		window.matchMedia(query).addEventListener('change', handleChange);
		return () => {
			window.matchMedia(query).removeEventListener('change', handleChange);
		};
	});

	return systemTheme;
}

export {useSystemTheme};
