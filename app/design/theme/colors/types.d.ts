export type THexColor = `#${string}`;

export type TColorScale = {
	50: THexColor;
	100: THexColor;
	200: THexColor;
	300: THexColor;
	400: THexColor;
	500: THexColor;
	600: THexColor;
	700: THexColor;
	800: THexColor;
	900: THexColor;
};

type TColor = TColorScale & {
	/** @see {@link https://tailwindcss.com/docs/customizing-colors#color-object-syntax} */
	DEFAULT?: string;
	foreground?: string;
};

type TBaseColors = {
	background: TColor;
	content1: TColor;
	content2: TColor;
	divider: TColor;
	focus: TColor;
	foreground: TColor;
	overlay: TColor;
};

export type TSemanticBaseColors = {
	dark: TBaseColors;
	light: TBaseColors;
};

export type TThemeColors = TBaseColors & {
	danger: TColor;
	default: TColor;
	primary: TColor;
	secondary: TColor;
	success: TColor;
	warning: TColor;
};
