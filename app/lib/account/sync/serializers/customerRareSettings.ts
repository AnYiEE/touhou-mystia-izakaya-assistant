import { type ISyncNamespaceSerializer } from '@/lib/account/sync';
import { customerRareStore } from '@/stores/customer-rare';
import { isPlainObject, mergeFieldMap } from './utils';

export interface ICustomerRareSettingsSnapshot {
	orderLinkedFilter: boolean;
	showTagDescription: boolean;
}

export const customerRareSettingsSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return { orderLinkedFilter: true, showTagDescription: true };
	},
	getLocalSnapshot() {
		return {
			orderLinkedFilter:
				customerRareStore.persistence.customer.orderLinkedFilter.get(),
			showTagDescription:
				customerRareStore.persistence.customer.showTagDescription.get(),
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
		customerRareStore.persistence.customer.orderLinkedFilter.set(
			data.orderLinkedFilter
		);
		customerRareStore.persistence.customer.showTagDescription.set(
			data.showTagDescription
		);
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
