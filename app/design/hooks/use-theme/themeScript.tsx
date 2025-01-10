import {COLOR_MAP, MEDIA, STORAGE_KEY, THEME_MAP} from './constants';
import {TTheme} from './types';

const script = (
	media: typeof MEDIA,
	storageKey: typeof STORAGE_KEY,
	themeMap: typeof THEME_MAP,
	colors: typeof COLOR_MAP
) => {
	try {
		const systemTheme = globalThis.matchMedia(media).matches ? themeMap.DARK : themeMap.LIGHT;
		const storedTheme = (localStorage.getItem(storageKey) as TTheme | null) ?? systemTheme;

		const currentTheme = storedTheme === themeMap.SYSTEM ? systemTheme : storedTheme;
		const isDarkTheme = currentTheme === themeMap.DARK;

		document.documentElement.classList.remove(...Object.values(themeMap));
		document.documentElement.classList.add(currentTheme);
		document.documentElement.style.colorScheme = currentTheme;

		const metaElement = document.createElement('meta');
		metaElement.content = isDarkTheme ? colors.DARK : colors.LIGHT;
		metaElement.name = 'theme-color';

		document.head.append(metaElement);
	} catch (error) {
		console.error('[hooks/use-theme]:', error);
	}
};

export default function ThemeScript() {
	const scriptArgs = JSON.stringify([MEDIA, STORAGE_KEY, THEME_MAP, COLOR_MAP]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
