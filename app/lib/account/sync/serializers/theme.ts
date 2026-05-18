import { STORAGE_KEY, THEME_MAP, applyTheme, parseTheme } from '@/design/hooks';
import { type TTheme } from '@/design/hooks/use-theme/types';
import { type ISyncNamespaceSerializer } from '@/lib/account/sync';
import { safeStorage } from '@/utilities';
import { checkSnapshotEqual, createMergeResult } from './utils';

export type TThemeSnapshot = TTheme;

const themes = new Set<string>(Object.values(THEME_MAP));

export const themeSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return THEME_MAP.SYSTEM;
	},
	getLocalSnapshot() {
		return parseTheme(safeStorage.getItem(STORAGE_KEY));
	},
	merge({ cloud, local }) {
		if (cloud === null) {
			return createMergeResult({
				data: local,
				shouldUpload: !checkSnapshotEqual(
					local,
					this.getDefaultSnapshot()
				),
			});
		}

		return createMergeResult({ data: cloud, shouldUpload: false });
	},
	migrate(data) {
		if (!this.validate(data)) {
			throw new Error('invalid-theme');
		}

		return data;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		applyTheme(data);
	},
	validate(data): data is TThemeSnapshot {
		return typeof data === 'string' && themes.has(data);
	},
} satisfies ISyncNamespaceSerializer<TThemeSnapshot>;
