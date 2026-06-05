import { type ISyncNamespaceSerializer } from '@/lib/account/sync';
import { customerRareStore } from '@/stores/customer-rare';
import { isPlainObject, mergeFieldMap } from './utils';

export interface ICustomerRareSettingsSnapshot {
	orderLinkedFilter: boolean;
	showTagDescription: boolean;
}

function getBooleanSetting(value: unknown, fallback: boolean) {
	return typeof value === 'boolean' ? value : fallback;
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

		return {
			orderLinkedFilter: getBooleanSetting(
				customerRareStore.persistence.customer.orderLinkedFilter.get(),
				defaults.orderLinkedFilter
			),
			showTagDescription: getBooleanSetting(
				customerRareStore.persistence.customer.showTagDescription.get(),
				defaults.showTagDescription
			),
		};
	},
	merge({ base, cloud, local }) {
		return {
			conflict: null,
			...mergeFieldMap({
				base,
				cloud,
				defaults: this.getDefaultSnapshot(),
				local,
			}),
		};
	},
	migrate(data, version) {
		if (version !== 1) {
			throw new Error(
				'unsupported-customer-rare-settings-schema-version'
			);
		}

		if (!this.validate(data)) {
			throw new Error('invalid-customer-rare-settings');
		}

		return data;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		customerRareStore.persistence.customer.assign({
			orderLinkedFilter: data.orderLinkedFilter,
			showTagDescription: data.showTagDescription,
		});
	},
	validate(data): data is ICustomerRareSettingsSnapshot {
		return (
			isPlainObject(data) &&
			Object.keys(data).length === 2 &&
			typeof data['orderLinkedFilter'] === 'boolean' &&
			typeof data['showTagDescription'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<ICustomerRareSettingsSnapshot>;
