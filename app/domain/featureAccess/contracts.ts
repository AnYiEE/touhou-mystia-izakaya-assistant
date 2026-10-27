export type TFeatureAccessLevel = 'authenticated' | 'granted' | 'public';

export type TStaticFeatureModuleKey =
	'account.sync' | 'maps.full' | 'maps.preview' | 'sso.use';

export type TSsoAppFeatureModuleKey = `sso.app:${string}`;

export type TFeatureModuleKey =
	TSsoAppFeatureModuleKey | TStaticFeatureModuleKey;

export type TFeatureAccessReason =
	'allowed' | 'denied' | 'grant-required' | 'login-required' | 'unavailable';

export type TFeatureAccessSource =
	| 'authenticated'
	| 'direct-allow'
	| 'group-allow'
	| 'implied'
	| 'override-deny'
	| 'public';

export type TFeatureAccessDirectOverride = 'allow' | 'deny' | null;

export type TFeatureAccessOverrideEffect = Exclude<
	TFeatureAccessDirectOverride,
	null
>;

export interface IFeatureAccessReasonState {
	access_level: TFeatureAccessLevel;
	allowed: boolean;
	reason: TFeatureAccessReason;
}

export interface IFeatureAccessResponse {
	modules: Readonly<Record<TFeatureModuleKey, IFeatureAccessReasonState>>;
}

export interface IFeatureAccessDefinition<
	TKey extends string = TFeatureModuleKey,
> {
	defaultAccess: TFeatureAccessLevel;
	implies?: ReadonlyArray<TKey>;
	isAvailable: boolean;
	key: TKey;
}

export interface IFeatureModuleDefinition<
	TKey extends string = TFeatureModuleKey,
> extends IFeatureAccessDefinition<TKey> {
	description: string;
	label: string;
}

export interface IEffectiveFeatureAccess<
	TKey extends string = TFeatureModuleKey,
> {
	allowed: boolean;
	directOverride: TFeatureAccessDirectOverride;
	groupIds: string[];
	moduleKey: TKey;
	policy: TFeatureAccessLevel;
	reason: TFeatureAccessReason;
	sources: TFeatureAccessSource[];
}

const SSO_APP_FEATURE_MODULE_PREFIX = 'sso.app:';

export function createSsoAppFeatureModuleKey(
	clientId: string
): TSsoAppFeatureModuleKey {
	return `${SSO_APP_FEATURE_MODULE_PREFIX}${clientId}`;
}

export function isSsoAppFeatureModuleKey(
	value: string
): value is TSsoAppFeatureModuleKey {
	return (
		value.startsWith(SSO_APP_FEATURE_MODULE_PREFIX) &&
		value.length > SSO_APP_FEATURE_MODULE_PREFIX.length
	);
}
