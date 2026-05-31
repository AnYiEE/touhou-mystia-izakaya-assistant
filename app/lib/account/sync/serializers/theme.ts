import { STORAGE_KEY, THEME_MAP, applyTheme, parseTheme } from '@/design/hooks';
import { type TTheme } from '@/design/hooks/use-theme/types';
import { type ISyncNamespaceSerializer } from '@/lib/account/sync';
import { safeStorage } from '@/utilities';
import {
	checkSnapshotEqual,
	createMergeResult,
	createSerializerConflict,
} from './utils';

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
	merge({ allowBaseNullAutoMerge = false, base, cloud, local, namespace }) {
		const defaultSnapshot = this.getDefaultSnapshot();

		if (cloud === null) {
			return createMergeResult({
				data: local,
				shouldUpload: !checkSnapshotEqual(local, defaultSnapshot),
			});
		}
		if (checkSnapshotEqual(local, cloud)) {
			return createMergeResult({ data: cloud, shouldUpload: false });
		}
		if (base === null) {
			if (checkSnapshotEqual(local, defaultSnapshot)) {
				if (allowBaseNullAutoMerge) {
					return createMergeResult({
						data: cloud,
						shouldUpload: false,
					});
				}

				return createMergeResult({
					conflict: createSerializerConflict({
						cloud,
						local,
						namespace,
						userId: '',
					}),
					data: cloud,
					shouldUpload: false,
				});
			}
			if (checkSnapshotEqual(cloud, defaultSnapshot)) {
				return createMergeResult({ data: local, shouldUpload: true });
			}
			if (allowBaseNullAutoMerge) {
				return createMergeResult({ data: cloud, shouldUpload: false });
			}

			return createMergeResult({
				conflict: createSerializerConflict({
					cloud,
					local,
					namespace,
					userId: '',
				}),
				data: cloud,
				shouldUpload: false,
			});
		}

		const hasLocalChange = !checkSnapshotEqual(local, base);
		const hasCloudChange = !checkSnapshotEqual(cloud, base);
		if (!hasLocalChange) {
			return createMergeResult({ data: cloud, shouldUpload: false });
		}
		if (!hasCloudChange) {
			return createMergeResult({ data: local, shouldUpload: true });
		}

		return createMergeResult({
			conflict: createSerializerConflict({
				cloud,
				local,
				namespace,
				userId: '',
			}),
			data: cloud,
			shouldUpload: false,
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
		applyTheme(data);
	},
	validate(data): data is TThemeSnapshot {
		return typeof data === 'string' && themes.has(data);
	},
} satisfies ISyncNamespaceSerializer<TThemeSnapshot>;
