import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const FEATURE_ACCESS_MESSAGES_ZH_CN = {
	'featureAccess.action.donate': '捐赠',
	'featureAccess.action.login': '登录账号',
	'featureAccess.action.retry': '重试',
	'featureAccess.api.denied': '管理员已禁止当前账号使用此功能。',
	'featureAccess.api.grantRequired': '当前账号尚未获得此功能的使用权限。',
	'featureAccess.api.loginRequired':
		'登录后可确认当前账号是否可以使用此功能。',
	'featureAccess.api.unavailable': '暂时无法确认此功能的使用权限。',
	'featureAccess.body.denied':
		'管理员已禁止当前账号使用{feature}。如需使用，请联系管理员。',
	'featureAccess.body.grantRequired':
		'当前账号尚未获得{feature}的使用权限。如需使用，请联系管理员。',
	'featureAccess.body.loginRequired':
		'登录后可确认当前账号是否可以使用{feature}。',
	'featureAccess.body.unavailable':
		'暂时无法确认{feature}的使用权限，请稍后重试。',
	'featureAccess.label.fallbackFeature': '此功能',
	'featureAccess.module.accountSync.description': '账号数据在设备之间同步',
	'featureAccess.module.accountSync.label': '云同步',
	'featureAccess.module.mapsFull.description':
		'使用高清地图、跨地图导航和进阶功能',
	'featureAccess.module.mapsFull.label': '完整地图',
	'featureAccess.module.mapsPreview.description':
		'查看低清地图、标记和基础详情',
	'featureAccess.module.mapsPreview.label': '地图预览',
	'featureAccess.module.ssoApp.description':
		'登录{shortName}账号以授权给{client}',
	'featureAccess.module.ssoApp.fallbackLabel': 'SSO应用',
	'featureAccess.module.ssoUse.description':
		'登录{shortName}账号以授权给外部应用',
	'featureAccess.module.ssoUse.label': 'SSO授权',
	'featureAccess.title.accountSyncUnavailable': '云同步不可用',
	'featureAccess.title.denied': '当前账号无权使用{feature}',
	'featureAccess.title.grantRequired': '{feature}需要额外权限',
	'featureAccess.title.loginRequired': '登录后使用{feature}',
	'featureAccess.title.unavailable': '暂时无法验证{feature}权限',
} as const;

export type TFeatureAccessMessageKey =
	keyof typeof FEATURE_ACCESS_MESSAGES_ZH_CN;

export const featureAccessMessages = {
	en: {
		'featureAccess.action.donate': 'Donate',
		'featureAccess.action.login': 'Sign in',
		'featureAccess.action.retry': 'Retry',
		'featureAccess.api.denied':
			'An administrator has blocked the current account from using this feature.',
		'featureAccess.api.grantRequired':
			'The current account does not have permission to use this feature.',
		'featureAccess.api.loginRequired':
			'Sign in to check whether the current account can use this feature.',
		'featureAccess.api.unavailable':
			'Access to this feature cannot be verified right now.',
		'featureAccess.body.denied':
			'An administrator has blocked the current account from using {feature}. Contact an administrator if you need access.',
		'featureAccess.body.grantRequired':
			'The current account does not have permission to use {feature}. Contact an administrator if you need access.',
		'featureAccess.body.loginRequired':
			'Sign in to check whether the current account can use {feature}.',
		'featureAccess.body.unavailable':
			'Unable to verify access to {feature} right now. Try again later.',
		'featureAccess.label.fallbackFeature': 'this feature',
		'featureAccess.module.accountSync.description':
			'Sync account data across devices',
		'featureAccess.module.accountSync.label': 'Cloud sync',
		'featureAccess.module.mapsFull.description':
			'Use high-resolution maps, cross-map navigation, and advanced features',
		'featureAccess.module.mapsFull.label': 'Full map',
		'featureAccess.module.mapsPreview.description':
			'View low-resolution maps, markers, and basic details',
		'featureAccess.module.mapsPreview.label': 'Map preview',
		'featureAccess.module.ssoApp.description':
			'Sign in with your {shortName} account to authorize {client}',
		'featureAccess.module.ssoApp.fallbackLabel': 'SSO app',
		'featureAccess.module.ssoUse.description':
			'Sign in with your {shortName} account to authorize external apps',
		'featureAccess.module.ssoUse.label': 'SSO authorization',
		'featureAccess.title.accountSyncUnavailable': 'Cloud sync unavailable',
		'featureAccess.title.denied': 'This account cannot use {feature}',
		'featureAccess.title.grantRequired':
			'Additional permission required for {feature}',
		'featureAccess.title.loginRequired': 'Sign in to use {feature}',
		'featureAccess.title.unavailable':
			'Unable to verify access to {feature}',
	},
	ja: {
		'featureAccess.action.donate': '支援する',
		'featureAccess.action.login': 'ログイン',
		'featureAccess.action.retry': '再試行',
		'featureAccess.api.denied':
			'管理者が現在のアカウントによるこの機能の利用を禁止しています。',
		'featureAccess.api.grantRequired':
			'現在のアカウントにはこの機能の利用権限がありません。',
		'featureAccess.api.loginRequired':
			'ログインすると、この機能を利用できるか確認できます。',
		'featureAccess.api.unavailable':
			'現在、この機能の利用権限を確認できません。',
		'featureAccess.body.denied':
			'管理者が現在のアカウントによる{feature}の利用を禁止しています。利用が必要な場合は管理者に問い合わせてください。',
		'featureAccess.body.grantRequired':
			'現在のアカウントには{feature}の利用権限がありません。利用が必要な場合は管理者に問い合わせてください。',
		'featureAccess.body.loginRequired':
			'ログインすると、{feature}を利用できるか確認できます。',
		'featureAccess.body.unavailable':
			'現在、{feature}の利用権限を確認できません。しばらくしてから再試行してください。',
		'featureAccess.label.fallbackFeature': 'この機能',
		'featureAccess.module.accountSync.description':
			'アカウントデータを端末間で同期',
		'featureAccess.module.accountSync.label': 'クラウド同期',
		'featureAccess.module.mapsFull.description':
			'高画質地図、地図間の移動、拡張機能を利用',
		'featureAccess.module.mapsFull.label': '完全な地図',
		'featureAccess.module.mapsPreview.description':
			'低画質の地図、マーカー、基本詳細を表示',
		'featureAccess.module.mapsPreview.label': '地図プレビュー',
		'featureAccess.module.ssoApp.description':
			'{client}への認可のため{shortName}アカウントでログイン',
		'featureAccess.module.ssoApp.fallbackLabel': 'SSOアプリ',
		'featureAccess.module.ssoUse.description':
			'外部アプリへの認可のため{shortName}アカウントでログイン',
		'featureAccess.module.ssoUse.label': 'SSO認可',
		'featureAccess.title.accountSyncUnavailable':
			'クラウド同期を利用できません',
		'featureAccess.title.denied':
			'このアカウントでは{feature}を利用できません',
		'featureAccess.title.grantRequired':
			'{feature}には追加の権限が必要です',
		'featureAccess.title.loginRequired':
			'{feature}を利用するにはログインしてください',
		'featureAccess.title.unavailable':
			'{feature}の利用権限を確認できません',
	},
	ko: {
		'featureAccess.action.donate': '후원하기',
		'featureAccess.action.login': '로그인',
		'featureAccess.action.retry': '다시 시도',
		'featureAccess.api.denied':
			'관리자가 현재 계정의 이 기능 사용을 금지했습니다.',
		'featureAccess.api.grantRequired':
			'현재 계정에는 이 기능을 사용할 권한이 없습니다.',
		'featureAccess.api.loginRequired':
			'로그인하면 현재 계정에서 이 기능을 사용할 수 있는지 확인할 수 있습니다.',
		'featureAccess.api.unavailable':
			'현재 이 기능의 사용 권한을 확인할 수 없습니다.',
		'featureAccess.body.denied':
			'관리자가 현재 계정의 {feature} 사용을 금지했습니다. 사용이 필요하면 관리자에게 문의하세요.',
		'featureAccess.body.grantRequired':
			'현재 계정에는 {feature} 사용 권한이 없습니다. 사용이 필요하면 관리자에게 문의하세요.',
		'featureAccess.body.loginRequired':
			'로그인하면 현재 계정에서 {feature} 사용 가능 여부를 확인할 수 있습니다.',
		'featureAccess.body.unavailable':
			'현재 {feature} 사용 권한을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
		'featureAccess.label.fallbackFeature': '이 기능',
		'featureAccess.module.accountSync.description':
			'계정 데이터를 기기 간에 동기화',
		'featureAccess.module.accountSync.label': '클라우드 동기화',
		'featureAccess.module.mapsFull.description':
			'고화질 지도, 지도 간 이동 및 고급 기능 사용',
		'featureAccess.module.mapsFull.label': '전체 지도',
		'featureAccess.module.mapsPreview.description':
			'저화질 지도, 마커 및 기본 상세 정보 보기',
		'featureAccess.module.mapsPreview.label': '지도 미리보기',
		'featureAccess.module.ssoApp.description':
			'{client}에 권한을 부여하려면 {shortName} 계정으로 로그인하세요',
		'featureAccess.module.ssoApp.fallbackLabel': 'SSO 앱',
		'featureAccess.module.ssoUse.description':
			'외부 앱에 권한을 부여하려면 {shortName} 계정으로 로그인하세요',
		'featureAccess.module.ssoUse.label': 'SSO 권한 부여',
		'featureAccess.title.accountSyncUnavailable':
			'클라우드 동기화 사용 불가',
		'featureAccess.title.denied': '현재 계정의 {feature} 사용 권한 없음',
		'featureAccess.title.grantRequired':
			'{feature} 사용을 위한 추가 권한 필요',
		'featureAccess.title.loginRequired':
			'{feature} 사용을 위해 로그인 필요',
		'featureAccess.title.unavailable': '{feature} 사용 권한 확인 불가',
	},
	'zh-CN': FEATURE_ACCESS_MESSAGES_ZH_CN,
	'zh-TW': {
		'featureAccess.action.donate': '捐贈',
		'featureAccess.action.login': '登入帳號',
		'featureAccess.action.retry': '重試',
		'featureAccess.api.denied': '管理員已禁止目前帳號使用此功能。',
		'featureAccess.api.grantRequired': '目前帳號尚未取得此功能的使用權限。',
		'featureAccess.api.loginRequired':
			'登入後可確認目前帳號是否可以使用此功能。',
		'featureAccess.api.unavailable': '暫時無法確認此功能的使用權限。',
		'featureAccess.body.denied':
			'管理員已禁止目前帳號使用{feature}。如需使用，請聯絡管理員。',
		'featureAccess.body.grantRequired':
			'目前帳號尚未取得{feature}的使用權限。如需使用，請聯絡管理員。',
		'featureAccess.body.loginRequired':
			'登入後可確認目前帳號是否可以使用{feature}。',
		'featureAccess.body.unavailable':
			'暫時無法確認{feature}的使用權限，請稍後重試。',
		'featureAccess.label.fallbackFeature': '此功能',
		'featureAccess.module.accountSync.description':
			'帳號資料在裝置之間同步',
		'featureAccess.module.accountSync.label': '雲端同步',
		'featureAccess.module.mapsFull.description':
			'使用高畫質地圖、跨地圖導覽和進階功能',
		'featureAccess.module.mapsFull.label': '完整地圖',
		'featureAccess.module.mapsPreview.description':
			'檢視低畫質地圖、標記和基本詳情',
		'featureAccess.module.mapsPreview.label': '地圖預覽',
		'featureAccess.module.ssoApp.description':
			'登入{shortName}帳號以授權給{client}',
		'featureAccess.module.ssoApp.fallbackLabel': 'SSO應用程式',
		'featureAccess.module.ssoUse.description':
			'登入{shortName}帳號以授權給外部應用程式',
		'featureAccess.module.ssoUse.label': 'SSO授權',
		'featureAccess.title.accountSyncUnavailable': '雲端同步不可用',
		'featureAccess.title.denied': '目前帳號無權使用{feature}',
		'featureAccess.title.grantRequired': '{feature}需要額外權限',
		'featureAccess.title.loginRequired': '登入後使用{feature}',
		'featureAccess.title.unavailable': '暫時無法驗證{feature}權限',
	},
} as const satisfies TLocalizedMessageTable<TFeatureAccessMessageKey>;
