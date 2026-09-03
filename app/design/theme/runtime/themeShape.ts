import { isObjectTagRecord } from '../../../shared/utilities/objects/isObjectTagRecord';
import type { IPersistedShape } from '../../../shared/utilities/state/persistedShape';
import { DARK_PALETTE_MAP, LIGHT_PALETTE_MAP, THEME_MAP } from './constants';
import type {
	IThemePreferences,
	TDarkPalette,
	TLightPalette,
	TTheme,
} from './types';

const darkPaletteValues = new Set<string>(Object.values(DARK_PALETTE_MAP));
const lightPaletteValues = new Set<string>(Object.values(LIGHT_PALETTE_MAP));
const themeValues = new Set<string>(Object.values(THEME_MAP));

function parseDarkPalette(value: unknown): TDarkPalette {
	return typeof value === 'string' && darkPaletteValues.has(value)
		? (value as TDarkPalette)
		: DARK_PALETTE_MAP.IZAKAYA;
}

function parseLightPalette(value: unknown): TLightPalette {
	return typeof value === 'string' && lightPaletteValues.has(value)
		? (value as TLightPalette)
		: LIGHT_PALETTE_MAP.IZAKAYA;
}

function parseTheme(value: unknown): TTheme {
	return typeof value === 'string' && themeValues.has(value)
		? (value as TTheme)
		: THEME_MAP.SYSTEM;
}

export const themeShape = {
	createDefault() {
		return {
			darkPalette: DARK_PALETTE_MAP.IZAKAYA,
			lightPalette: LIGHT_PALETTE_MAP.IZAKAYA,
			mode: THEME_MAP.SYSTEM,
		} satisfies IThemePreferences;
	},
	migrate(value: unknown, version: number): IThemePreferences {
		let migratedData: unknown = value;
		if (version === 1) {
			if (
				parseTheme(value) === THEME_MAP.SYSTEM &&
				typeof value !== 'string'
			) {
				throw new Error('invalid-theme');
			}
			migratedData = {
				...themeShape.createDefault(),
				mode: parseTheme(value),
			};
		} else if (version !== 2) {
			throw new Error('unsupported-theme-schema-version');
		}
		return themeShape.normalize(migratedData);
	},
	normalize(value: unknown): IThemePreferences {
		const record = isObjectTagRecord(value) ? value : {};
		return {
			darkPalette: parseDarkPalette(record['darkPalette']),
			lightPalette: parseLightPalette(record['lightPalette']),
			mode: parseTheme(record['mode']),
		} satisfies IThemePreferences;
	},
	validate(value: unknown): value is IThemePreferences {
		return (
			isObjectTagRecord(value) &&
			Object.keys(value).length === 3 &&
			'darkPalette' in value &&
			'lightPalette' in value &&
			'mode' in value &&
			typeof value['darkPalette'] === 'string' &&
			darkPaletteValues.has(value['darkPalette']) &&
			typeof value['lightPalette'] === 'string' &&
			lightPaletteValues.has(value['lightPalette']) &&
			typeof value['mode'] === 'string' &&
			themeValues.has(value['mode'])
		);
	},
} satisfies IPersistedShape<IThemePreferences>;
