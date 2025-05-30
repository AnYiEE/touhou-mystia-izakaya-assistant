// cSpell:disable
import type {TThemeConfig} from '../types';

export const fontFamily = {
	mono: [
		'"DejaVu Sans Code"',
		'"Source Code Pro"',
		'"JetBrains Mono"',
		'"DejaVu Sans Mono"',
		'"Roboto Mono"',
		'Menlo',
		'Monaco',
		'Consolas',
		'"Liberation Mono"',
		'"Courier New"',
		'Courier',
		'"Source Han Mono SC"',
		'"Source Han Mono TC"',
		'"Source Han Mono"',
		'-apple-system',
		'BlinkMacSystemFont',
		'"PingFang SC"',
		'"PingFang TC"',
		'"Source Han Sans SC"',
		'"Source Han Sans TC"',
		'"Source Han Sans"',
		'"Noto Sans CJK SC"',
		'"Noto Sans CJK TC"',
		'"Noto Sans CJK"',
		'"Microsoft YaHei"',
		'"WenQuanYi Micro Hei"',
		'"Apple Color Emoji"',
		'"Noto Color Emoji"',
		'"Segoe UI Emoji"',
		'"Segoe UI Symbol"',
		'emoji',
		'ui-monospace',
		'monospace',
	],
	sans: [
		'-apple-system',
		'BlinkMacSystemFont',
		'"Helvetica Neue"',
		'"Source Sans Pro"',
		'"Source Sans 3"',
		'"Noto Sans"',
		'Roboto',
		'Inter',
		'"Segoe UI"',
		'Arial',
		'"PingFang SC"',
		'"PingFang TC"',
		'"Source Han Sans SC"',
		'"Source Han Sans TC"',
		'"Source Han Sans"',
		'"Noto Sans CJK SC"',
		'"Noto Sans CJK TC"',
		'"Noto Sans CJK"',
		'"Microsoft YaHei"',
		'"WenQuanYi Micro Hei"',
		'"Apple Color Emoji"',
		'"Noto Color Emoji"',
		'"Segoe UI Emoji"',
		'"Segoe UI Symbol"',
		'emoji',
		'ui-sans-serif',
		'system-ui',
		'sans-serif',
	],
} as const satisfies TThemeConfig['fontFamily'];
