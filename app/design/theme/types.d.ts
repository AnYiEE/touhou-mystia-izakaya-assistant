import {type Config} from 'tailwindcss';

export type TThemeConfig = NonNullable<Config['theme']>;
export type TThemeExtendConfig = NonNullable<TThemeConfig['extend']>;
