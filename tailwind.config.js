// @ts-check
/* eslint-disable sort-keys, @typescript-eslint/no-var-requires, unicorn/prefer-module */
'use strict';

const {nextui} = require('@nextui-org/react');

const isProduction = process.env.NODE_ENV === 'production';

const black = {
	50: '#f3f3ec',
	100: '#dcdad6',
	200: '#c4c1bd',
	300: '#aba8a2',
	400: '#948f88',
	500: '#7a766e',
	600: '#605c55',
	700: '#44423c',
	800: '#292723',
	900: '#120c05',
};

const brown = {
	50: '#fef7e4',
	100: '#ede0c4',
	200: '#ddc9a1',
	300: '#cfb07d',
	400: '#c19658',
	500: '#a8793f',
	600: '#825c30',
	700: '#5e3f22',
	800: '#392812',
	900: '#180f00',
};

const green = {
	50: '#edf8e6',
	100: '#d3e6c9',
	200: '#b8d3aa',
	300: '#9cc189',
	400: '#81b069',
	500: '#68964f',
	600: '#50753d',
	700: '#39532a',
	800: '#213317',
	900: '#061300',
};

const orange = {
	50: '#ffeee2',
	100: '#f5d1bd',
	200: '#eab595',
	300: '#e0976c',
	400: '#d67943',
	500: '#bc6029',
	600: '#934b1f',
	700: '#6a3515',
	800: '#411f09',
	900: '#1b0800',
};

const pink = {
	50: '#ffe8ec',
	100: '#f1c3c9',
	200: '#e29ca4',
	300: '#d67680',
	400: '#c94f5d',
	500: '#b03643',
	600: '#892934',
	700: '#631d25',
	800: '#3d1015',
	900: '#1b0305',
};

const purple = {
	50: '#ffe3ff',
	100: '#feb2ff',
	200: '#fc80ff',
	300: '#fa4efe',
	400: '#f920fe',
	500: '#df0ce5',
	600: '#ae04b2',
	700: '#7d0080',
	800: '#4c004e',
	900: '#1c001d',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.tsx', './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'],
	darkMode: 'class',
	safelist: isProduction
		? [
				// For compatible with Safari <= 14
				{
					pattern: /space-(x|y)/u,
					variants: ['md', 'xl'],
				},
			]
		: undefined,
	theme: {
		extend: {}, // cSpell:disable
		fontFamily: {
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
		}, // cSpell:enable
	},
	plugins: [
		nextui({
			themes: {
				izakaya: {
					extend: 'light',
					colors: {
						background: {
							...brown,
							DEFAULT: brown[50],
						},
						foreground: {
							...black,
							DEFAULT: black[800],
						},
						focus: {
							...pink,
							DEFAULT: pink[600],
						},
						content1: {
							...brown,
							DEFAULT: brown[200],
						},
						content2: {
							...brown,
							DEFAULT: brown[100],
						},
						default: {
							...brown,
							DEFAULT: brown[400],
						},
						primary: {
							...brown,
							DEFAULT: brown[600],
						},
						secondary: {
							...purple,
							DEFAULT: purple[700],
						},
						success: {
							...green,
							DEFAULT: green[400],
						},
						warning: {
							...orange,
							DEFAULT: orange[400],
						},
						danger: {
							...pink,
							DEFAULT: pink[400],
						},
					},
				},
			},
		}),
	],
};
