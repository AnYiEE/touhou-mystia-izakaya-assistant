import {
	readThemePersistenceSnapshot,
	replaceThemePersistenceSnapshot,
} from '@/design/theme/runtime/accountSync';
import { THEME_MAP } from '@/design/theme/runtime/constants';
import type { TTheme } from '@/design/theme/runtime/types';

import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';

import { mergeThemeSnapshots } from './themeMerge';

const themes = new Set<string>(Object.values(THEME_MAP));

export const themeSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return THEME_MAP.SYSTEM;
	},
	getLocalSnapshot() {
		return readThemePersistenceSnapshot();
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
		if (version !== 1) {
			throw new Error('unsupported-theme-schema-version');
		}

		if (!this.validate(data)) {
			throw new Error('invalid-theme');
		}

		return data;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		replaceThemePersistenceSnapshot(data);
	},
	validate(data): data is TTheme {
		return typeof data === 'string' && themes.has(data);
	},
} satisfies ISyncNamespaceSerializer<TTheme>;
