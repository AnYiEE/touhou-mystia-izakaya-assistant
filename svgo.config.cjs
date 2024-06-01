module.exports = {
	js2svg: {
		eol: 'lf',
		finalNewline: false,
		indent: '\t',
	},
	multipass: true,
	plugins: [
		{
			name: 'preset-default',
			params: {
				overrides: {
					removeViewBox: false,
				},
			},
		},
		'removeRasterImages',
		'sortAttrs',
	],
};
