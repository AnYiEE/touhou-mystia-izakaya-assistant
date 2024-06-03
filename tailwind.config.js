const {nextui} = require('@nextui-org/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.tsx', './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {},
	},

	plugins: [nextui()],
};
