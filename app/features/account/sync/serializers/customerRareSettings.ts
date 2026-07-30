import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type ICustomerRareSettingsPersistenceSnapshot,
	readCustomerRareSettingsPersistenceSnapshot,
	replaceCustomerRareSettingsPersistenceSnapshot,
} from '@/features/catalog/customers/rare/client/state/accountSync';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { mergeFieldMap } from './utils';

function getBooleanSetting(value: unknown, fallback: boolean) {
	return typeof value === 'boolean' ? value : fallback;
}

function applyCustomerRareSettingsDefaults(
	data: unknown,
	defaults: ICustomerRareSettingsPersistenceSnapshot
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

export const customerRareSettingsSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return { orderLinkedFilter: true, showTagDescription: true };
	},
	getLocalSnapshot() {
		const defaults = this.getDefaultSnapshot();
		const snapshot = readCustomerRareSettingsPersistenceSnapshot();

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
				'unsupported-customer-rare-settings-schema-version'
			);
		}

		const dataWithDefaults = applyCustomerRareSettingsDefaults(
			data,
			this.getDefaultSnapshot()
		);
		if (!this.validate(dataWithDefaults)) {
			throw new Error('invalid-customer-rare-settings');
		}

		return dataWithDefaults;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		replaceCustomerRareSettingsPersistenceSnapshot(data);
	},
	validate(data): data is ICustomerRareSettingsPersistenceSnapshot {
		return (
			isObjectTagRecord(data) &&
			Object.keys(data).length === 2 &&
			typeof data['orderLinkedFilter'] === 'boolean' &&
			typeof data['showTagDescription'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<ICustomerRareSettingsPersistenceSnapshot>;
