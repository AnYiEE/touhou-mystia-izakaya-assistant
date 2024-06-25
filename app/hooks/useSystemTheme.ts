import {useEffect, useState} from 'react';

export enum Theme {
	dark = 'dark',
	light = 'light',
	system = 'system',
}

function useSystemTheme() {
	const [systemTheme, setSystemTheme] = useState<Theme>(Theme.system);

	useEffect(() => {
		const mediaQueryList = window.matchMedia('(prefers-color-scheme: light)');

		setSystemTheme(mediaQueryList.matches ? Theme.light : Theme.dark);

		const handleChange = (event: MediaQueryListEvent) => {
			setSystemTheme(event.matches ? Theme.light : Theme.dark);
		};

		mediaQueryList.addEventListener('change', handleChange);

		return () => {
			mediaQueryList.removeEventListener('change', handleChange);
		};
	}, []);

	return systemTheme;
}

export {useSystemTheme};
