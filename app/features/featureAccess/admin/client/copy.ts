import type {
	TFeatureAccessLevel,
	TFeatureAccessReason,
	TFeatureAccessSource,
} from '@/domain/featureAccess/contracts';

export const FEATURE_ACCESS_ADMIN_MESSAGE_MAP = {
	groupCreated: '授权组已创建',
	groupCreateFailed: '创建授权组失败',
	groupDeleteConfirm: '确认删除',
	groupDeleted: '授权组已删除',
	groupDeleteFailed: '删除授权组失败',
	groupLoadedFailed: '读取授权组失败',
	groupNameConflict: '授权组名称已存在',
	groupNotFound: '授权组不存在或已被删除',
	groupSaved: '授权组已保存',
	groupSaveFailed: '保存授权组失败',
	groupsReadFailed: '读取授权组失败',
	moduleInvalid: '功能模块不存在或当前不可用',
	modulePolicySaved: '模块策略已保存',
	modulePolicySaveFailed: '保存模块策略失败',
	modulesReadFailed: '读取功能模块失败',
	userAccessReadFailed: '读取用户访问权限失败',
	userAccessSaved: '用户访问权限已保存',
	userAccessSaveFailed: '保存用户访问权限失败',
	userInvalid: '用户不存在或状态无效',
	userNotFound: '用户不存在',
	usersReadFailed: '读取用户列表失败',
} as const;

export const FEATURE_ACCESS_LEVEL_LABEL_MAP = {
	authenticated: '登录用户',
	granted: '仅授权用户',
	public: '公开',
} as const satisfies Record<TFeatureAccessLevel, string>;

export const FEATURE_ACCESS_REASON_LABEL_MAP = {
	allowed: '允许',
	denied: '已禁止',
	'grant-required': '缺少授权',
	'login-required': '需要登录',
	unavailable: '当前不可用',
} as const satisfies Record<TFeatureAccessReason, string>;

export const FEATURE_ACCESS_SOURCE_LABEL_MAP = {
	authenticated: '登录用户策略',
	'direct-allow': '用户直接允许',
	'group-allow': '授权组',
	implied: '依赖权限',
	'override-deny': '用户直接禁止',
	public: '公开策略',
} as const satisfies Record<TFeatureAccessSource, string>;
