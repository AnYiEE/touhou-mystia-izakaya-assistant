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

function applyCustomerRareSettingsDefaults(
	data: unknown,
	defaults: ICustomerRareSettingsSnapshot
) {
	if (data === null) {
		return defaults;
	}

	if (!isPlainObject(data)) {
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
