import { themeShape } from '@/design/theme/runtime/themeShape';
import type { IThemePreferences } from '@/design/theme/runtime/types';
import {
	applyThemePreferences,
	readThemePreferences,
} from '@/design/theme/runtime/useTheme';

import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';

import { mergeThemeSnapshots } from './themeMerge';

export const themeSerializer: ISyncNamespaceSerializer<IThemePreferences> = {
	deserialize(data) {
		return themeSerializer.migrate(data, 2);
	},
	getDefaultSnapshot() {
		return themeShape.createDefault();
	},
	getLocalSnapshot() {
		return themeShape.normalize(readThemePreferences());
	},
	merge({ base, cloud, local }) {
		return mergeThemeSnapshots({
			base,
			cloud,
			defaultSnapshot: themeSerializer.getDefaultSnapshot(),
			local,
		});
	},
	migrate(data, version) {
		return themeShape.migrate(data, version);
	},
	serialize(data) {
		return themeShape.normalize(data);
	},
	setLocalSnapshot(data) {
		applyThemePreferences(data);
	},
	validate(data): data is IThemePreferences {
		return themeShape.validate(data);
	},
} satisfies ISyncNamespaceSerializer<IThemePreferences>;
