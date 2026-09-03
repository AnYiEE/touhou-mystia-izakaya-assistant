import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import type { IPersistedShape } from '@/shared/utilities/state/persistedShape';

export interface ISpecialGuestSettingsPersistenceSnapshot {
	orderLinkedFilter: boolean;
	showTagDescription: boolean;
}

function isBooleanSetting(value: unknown, fallback: boolean) {
	return typeof value === 'boolean' ? value : fallback;
}

function createDefaultSpecialGuestSettings(): ISpecialGuestSettingsPersistenceSnapshot {
	return { orderLinkedFilter: true, showTagDescription: true };
}

export const specialGuestSettingsShape = {
	createDefault() {
		return createDefaultSpecialGuestSettings();
	},
	migrate(
		value: unknown,
		version: number
	): ISpecialGuestSettingsPersistenceSnapshot {
		if (version !== 1) {
			throw new Error(
				'unsupported-special-guest-settings-schema-version'
			);
		}
		if (!isObjectTagRecord(value)) {
			throw new Error('invalid-special-guest-settings-container');
		}
		return specialGuestSettingsShape.normalize(value);
	},
	normalize(value: unknown): ISpecialGuestSettingsPersistenceSnapshot {
		const defaults = createDefaultSpecialGuestSettings();
		const record = isObjectTagRecord(value) ? value : {};
		return {
			orderLinkedFilter: isBooleanSetting(
				record['orderLinkedFilter'],
				defaults.orderLinkedFilter
			),
			showTagDescription: isBooleanSetting(
				record['showTagDescription'],
				defaults.showTagDescription
			),
		} satisfies ISpecialGuestSettingsPersistenceSnapshot;
	},
	validate(
		value: unknown
	): value is ISpecialGuestSettingsPersistenceSnapshot {
		return (
			isObjectTagRecord(value) &&
			Object.keys(value).length === 2 &&
			typeof value['orderLinkedFilter'] === 'boolean' &&
			typeof value['showTagDescription'] === 'boolean'
		);
	},
} satisfies IPersistedShape<ISpecialGuestSettingsPersistenceSnapshot>;
