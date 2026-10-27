import type {
	IEffectiveFeatureAccess,
	IFeatureAccessReasonState,
	TFeatureAccessLevel,
	TFeatureAccessOverrideEffect,
	TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import type { IAccountUserProfile } from '@/features/account/contracts';

export const FEATURE_ACCESS_GROUP_DESCRIPTION_MAX_LENGTH = 500;
export const FEATURE_ACCESS_GROUP_NAME_MAX_LENGTH = 64;

export interface IAdminFeatureModuleRecord {
	access_level: TFeatureAccessLevel;
	default_access_level: TFeatureAccessLevel;
	description: string;
	is_available: boolean;
	key: TFeatureModuleKey;
	label: string;
	updated_at: number | null;
}

export interface IAdminFeatureModuleListData {
	modules: IAdminFeatureModuleRecord[];
}

export interface IAdminFeatureAccessGroupRecord {
	created_at: number;
	description: string;
	id: string;
	member_count: number;
	module_count: number;
	name: string;
	updated_at: number;
}

export interface IAdminFeatureAccessGroupListData {
	groups: IAdminFeatureAccessGroupRecord[];
}

export interface IAdminFeatureAccessGroupDetailData {
	group: IAdminFeatureAccessGroupRecord;
	members: IAccountUserProfile[];
	module_keys: TFeatureModuleKey[];
}

export interface IAdminFeatureAccessUserData {
	effective_access: Readonly<
		Record<TFeatureModuleKey, IEffectiveFeatureAccess>
	>;
	group_ids: string[];
	groups: IAdminFeatureAccessGroupRecord[];
	module_overrides: Readonly<
		Partial<Record<TFeatureModuleKey, TFeatureAccessOverrideEffect>>
	>;
	user: IAccountUserProfile;
}

export interface IAdminFeatureModulePolicyUpdateBody {
	access_level: TFeatureAccessLevel;
	module_key: TFeatureModuleKey;
}

export interface IAdminFeatureAccessGroupBody {
	description: string;
	module_keys: TFeatureModuleKey[];
	name: string;
	user_ids: string[];
}

export interface IAdminFeatureAccessUserUpdateBody {
	group_ids: string[];
	module_overrides: Partial<
		Record<TFeatureModuleKey, TFeatureAccessOverrideEffect>
	>;
}

export type TAdminFeatureAccessReasonState = IFeatureAccessReasonState;
