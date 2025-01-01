import {ratingColors} from '../colors';
import type {TThemeExtendConfig} from '../types';

export const getExtendConfig = (cdnUrl: string) =>
	({
		backgroundImage: {
			loading: `url("${cdnUrl}/assets/loading.gif")`,
			logo: `url("${cdnUrl}/assets/icon.png")`,
			mystia: `url("${cdnUrl}/assets/mystia.png")`,
		},
		backgroundSize: {
			'y-auto': 'auto 100%',
		},
		colors: {
			...ratingColors,
			'qq-blue': '#1479d7',
			'wx-green': '#07c160',
			xiaohongshu: '#ff2741',
		},
		gridTemplateColumns: {
			'fill-12': 'repeat(auto-fill,3rem)',
			'fill-16': 'repeat(auto-fill,4rem)',
			'fill-20': 'repeat(auto-fill,5rem)',
		},
		height: {
			loading: '120px',
		},
		maxHeight: {
			'dvh-safe-half': 'var(--safe-h-dvh-half)',
			'vmax-half': '50vmax',
		},
		maxWidth: {
			'p-95': '95%',
			'screen-p-30': '30vw',
			'screen-p-60': '60vw',
		},
		minHeight: {
			'dvh-safe': 'var(--safe-h-dvh)',
			'main-content': 'calc(var(--safe-h-dvh) - 8rem)',
			'main-content-pb-0': 'calc(var(--safe-h-dvh) - 6rem)',
		},
		padding: {
			titlebar: 'env(titlebar-area-height,0rem)',
		},
		width: {
			loading: '120px',
		},
		zIndex: {
			60: '60',
		},
	}) as const satisfies TThemeExtendConfig;

export * from './fontFamily';
