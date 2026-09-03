import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import {
	globalPreferencesSetValueOrders,
	globalPreferencesShape,
} from '@/features/account/sync/shapes/globalPreferences';
import type { TGlobalPreferencesSnapshot } from '@/features/account/sync/shapes/globalPreferencesTypes';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	readGlobalPreferencesPersistenceSource,
	replaceGlobalPreferencesPersistenceSnapshot,
} from '@/features/preferences/client/state/accountSync';

import { mergeGlobalPreferencesSnapshots } from './globalPreferencesMerge';

export const globalPreferencesSerializer: ISyncNamespaceSerializer<TGlobalPreferencesSnapshot> =
	{
		deserialize(data) {
			return globalPreferencesSerializer.migrate(
				data,
				SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.globalPreferences]
			);
		},
		getDefaultSnapshot() {
			return globalPreferencesShape.createDefault();
		},
		getLocalSnapshot() {
			return globalPreferencesShape.normalize(
				readGlobalPreferencesPersistenceSource()
			);
		},
		merge({ base, cloud, local, namespace }) {
			return mergeGlobalPreferencesSnapshots({
				base,
				cloud,
				defaults: globalPreferencesSerializer.getDefaultSnapshot(),
				local,
				namespace,
				setValueOrders: globalPreferencesSetValueOrders,
			});
		},
		migrate(data, version) {
			return globalPreferencesShape.migrate(data, version);
		},
		serialize(data) {
			return globalPreferencesShape.normalize(data);
		},
		setLocalSnapshot(data) {
			replaceGlobalPreferencesPersistenceSnapshot(
				globalPreferencesShape.normalize(data)
			);
		},
		validate(data): data is TGlobalPreferencesSnapshot {
			return globalPreferencesShape.validate(data);
		},
	} satisfies ISyncNamespaceSerializer<TGlobalPreferencesSnapshot>;
