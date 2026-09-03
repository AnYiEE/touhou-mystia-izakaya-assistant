import {
	type ISpecialGuestSettingsPersistenceSnapshot,
	specialGuestSettingsShape,
} from '@/features/account/sync/shapes/specialGuestSettings';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	readSpecialGuestSettingsPersistenceSnapshot,
	replaceSpecialGuestSettingsPersistenceSnapshot,
} from '@/features/catalog/guests/special/client/state/accountSync';

import { mergeFieldMap } from './utils';

export const specialGuestSettingsSerializer: ISyncNamespaceSerializer<ISpecialGuestSettingsPersistenceSnapshot> =
	{
		deserialize(data) {
			return specialGuestSettingsSerializer.migrate(data, 1);
		},
		getDefaultSnapshot() {
			return specialGuestSettingsShape.createDefault();
		},
		getLocalSnapshot() {
			return specialGuestSettingsShape.normalize(
				readSpecialGuestSettingsPersistenceSnapshot()
			);
		},
		merge({ allowBaseNullAutoMerge, base, cloud, local, namespace }) {
			return mergeFieldMap({
				allowBaseNullAutoMerge,
				base,
				cloud,
				defaults: specialGuestSettingsSerializer.getDefaultSnapshot(),
				local,
				namespace,
			});
		},
		migrate(data, version) {
			return specialGuestSettingsShape.migrate(data, version);
		},
		serialize(data) {
			return specialGuestSettingsShape.normalize(data);
		},
		setLocalSnapshot(data) {
			replaceSpecialGuestSettingsPersistenceSnapshot(
				specialGuestSettingsShape.normalize(data)
			);
		},
		validate(data): data is ISpecialGuestSettingsPersistenceSnapshot {
			return specialGuestSettingsShape.validate(data);
		},
	} satisfies ISyncNamespaceSerializer<ISpecialGuestSettingsPersistenceSnapshot>;
