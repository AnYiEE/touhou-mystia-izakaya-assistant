import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type ISpecialGuestSettingsPersistenceSnapshot,
	readSpecialGuestSettingsPersistenceSnapshot,
	replaceSpecialGuestSettingsPersistenceSnapshot,
} from '@/features/catalog/guests/special/client/state/accountSync';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { mergeFieldMap } from './utils';

function getBooleanSetting(value: unknown, fallback: boolean) {
	return typeof value === 'boolean' ? value : fallback;
}

function applySpecialGuestSettingsDefaults(
	data: unknown,
	defaults: ISpecialGuestSettingsPersistenceSnapshot
) {
	if (data === null) {
		return defaults;
	}

	if (!isObjectTagRecord(data)) {
		return data;
	}

	return {
		...data,
		orderLinkedFilter: Object.hasOwn(data, 'orderLinkedFilter')
			? data['orderLinkedFilter']
			: defaults.orderLinkedFilter,
		showTagDescription: Object.hasOwn(data, 'showTagDescription')
			? data['showTagDescription']
			: defaults.showTagDescription,
	};
}

export const specialGuestSettingsSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return { orderLinkedFilter: true, showTagDescription: true };
	},
	getLocalSnapshot() {
		const defaults = this.getDefaultSnapshot();
		const snapshot = readSpecialGuestSettingsPersistenceSnapshot();

		return {
			orderLinkedFilter: getBooleanSetting(
				snapshot.orderLinkedFilter,
				defaults.orderLinkedFilter
			),
			showTagDescription: getBooleanSetting(
				snapshot.showTagDescription,
				defaults.showTagDescription
			),
		};
	},
	merge({ allowBaseNullAutoMerge, base, cloud, local, namespace }) {
		return mergeFieldMap({
			allowBaseNullAutoMerge,
			base,
			cloud,
			defaults: this.getDefaultSnapshot(),
			local,
			namespace,
		});
	},
	migrate(data, version) {
		if (version !== 1) {
			throw new Error(
				'unsupported-special-guest-settings-schema-version'
			);
		}

		const dataWithDefaults = applySpecialGuestSettingsDefaults(
			data,
			this.getDefaultSnapshot()
		);
		if (!this.validate(dataWithDefaults)) {
			throw new Error('invalid-special-guest-settings');
		}

		return dataWithDefaults;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		replaceSpecialGuestSettingsPersistenceSnapshot(data);
	},
	validate(data): data is ISpecialGuestSettingsPersistenceSnapshot {
		return (
			isObjectTagRecord(data) &&
			Object.keys(data).length === 2 &&
			typeof data['orderLinkedFilter'] === 'boolean' &&
			typeof data['showTagDescription'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<ISpecialGuestSettingsPersistenceSnapshot>;
