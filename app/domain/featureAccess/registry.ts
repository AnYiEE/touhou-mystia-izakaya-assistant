import {
	type IFeatureAccessDefinition,
	type TStaticFeatureModuleKey,
} from './contracts';

export type TStaticFeatureModuleLocalizationKey =
	'accountSync' | 'mapsFull' | 'mapsPreview' | 'ssoUse';

export interface IStaticFeatureModuleRegistration<
	TKey extends TStaticFeatureModuleKey,
> extends IFeatureAccessDefinition<TKey> {
	localizationKey: TStaticFeatureModuleLocalizationKey;
}

export const STATIC_FEATURE_MODULE_REGISTRATION_MAP = {
	'account.sync': {
		defaultAccess: 'authenticated',
		isAvailable: true,
		key: 'account.sync',
		localizationKey: 'accountSync',
	},
	'maps.full': {
		defaultAccess: 'authenticated',
		implies: ['maps.preview'],
		isAvailable: true,
		key: 'maps.full',
		localizationKey: 'mapsFull',
	},
	'maps.preview': {
		defaultAccess: 'public',
		isAvailable: true,
		key: 'maps.preview',
		localizationKey: 'mapsPreview',
	},
	'sso.use': {
		defaultAccess: 'authenticated',
		isAvailable: true,
		key: 'sso.use',
		localizationKey: 'ssoUse',
	},
} as const satisfies Record<
	TStaticFeatureModuleKey,
	IStaticFeatureModuleRegistration<TStaticFeatureModuleKey>
>;

export function isStaticFeatureModuleKey(
	value: string
): value is TStaticFeatureModuleKey {
	return Object.hasOwn(STATIC_FEATURE_MODULE_REGISTRATION_MAP, value);
}
