import {
	DARK_PALETTE_MAP,
	LIGHT_PALETTE_MAP,
	THEME_MAP,
} from '@/design/theme/runtime/constants';
import type { IThemePreferences, TTheme } from '@/design/theme/runtime/types';
import {
	applyThemePreferences,
	readThemePreferences,
} from '@/design/theme/runtime/useTheme';

import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { hasExactKeys } from './utils';
import { mergeThemeSnapshots } from './themeMerge';

const darkPalettes = new Set<string>(Object.values(DARK_PALETTE_MAP));
const lightPalettes = new Set<string>(Object.values(LIGHT_PALETTE_MAP));
const themes = new Set<string>(Object.values(THEME_MAP));

function validateLegacyTheme(data: unknown): data is TTheme {
	return typeof data === 'string' && themes.has(data);
}

export const themeSerializer = {
	deserialize(data) {
		return this.migrate(data, 2);
	},
	getDefaultSnapshot() {
		return {
			darkPalette: DARK_PALETTE_MAP.IZAKAYA,
			lightPalette: LIGHT_PALETTE_MAP.IZAKAYA,
			mode: THEME_MAP.SYSTEM,
		};
	},
	getLocalSnapshot() {
		return readThemePreferences();
	},
	merge({ base, cloud, local }) {
		return mergeThemeSnapshots({
			base,
			cloud,
			defaultSnapshot: this.getDefaultSnapshot(),
			local,
		});
	},
	migrate(data, version) {
		let migratedData: unknown = data;
		if (version === 1) {
			if (!validateLegacyTheme(data)) {
				throw new Error('invalid-theme');
			}

			migratedData = { ...this.getDefaultSnapshot(), mode: data };
		} else if (version !== 2) {
			throw new Error('unsupported-theme-schema-version');
		}

		if (!this.validate(migratedData)) {
			throw new Error('invalid-theme');
		}

		return migratedData;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		applyThemePreferences(data);
	},
	validate(data): data is IThemePreferences {
		return (
			isObjectTagRecord(data) &&
			hasExactKeys(data, ['darkPalette', 'lightPalette', 'mode']) &&
			typeof data['darkPalette'] === 'string' &&
			darkPalettes.has(data['darkPalette']) &&
			typeof data['lightPalette'] === 'string' &&
			lightPalettes.has(data['lightPalette']) &&
			typeof data['mode'] === 'string' &&
			themes.has(data['mode'])
		);
	},
} satisfies ISyncNamespaceSerializer<IThemePreferences>;
