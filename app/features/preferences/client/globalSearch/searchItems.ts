import type { IGlobalSearchIndexItem } from '@/features/globalSearch/contracts';
import type { TPreferenceTargetKey } from '@/features/preferences/contracts';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

interface IPreferenceSearchIndexOptions {
	includeAccountItems?: boolean;
}

interface ILocalizedPreferenceSearchItemText {
	description: string;
	keywords?: ReadonlyArray<string>;
	label: string;
	sectionLabel?: string;
}

const BASE_PREFERENCE_SEARCH_ITEMS = [
	{
		description: '显示或隐藏各DLC数据集',
		key: 'global-hidden-dlcs',
		keywords: ['DLC', '资料片', '数据集开关', '隐藏DLC'],
		label: '数据集',
	},
	{
		description: '设置游戏中现时的流行趋势',
		key: 'global-popular-trend',
		keywords: ['流行喜爱', '流行厌恶', '明星店'],
		label: '流行趋势',
	},
	{
		description: '开启或关闭平滑滚动和磨砂效果',
		key: 'appearance-high-appearance',
		label: '平滑滚动和磨砂效果',
	},
	{
		description: '显示或隐藏顾客页面右下角的立绘',
		key: 'appearance-tachie',
		label: '顾客页面右下角的立绘',
	},
	{
		description: '开启或关闭操作震动反馈',
		key: 'experience-vibrate',
		label: '操作震动反馈',
	},
	{
		description: '显示或隐藏顾客卡片中标签的浮动提示',
		key: 'experience-tags-tooltip',
		label: '标签浮动提示',
	},
	{
		description: '显示或隐藏顾客页可用的料理、酒水和食材',
		key: 'guest-hidden-items',
		keywords: [
			'隐藏酒水',
			'隐藏料理',
			'隐藏食材',
			'显示酒水',
			'显示料理',
			'显示食材',
		],
		label: '隐藏料理/酒水/食材',
	},
	{
		action: 'open-special-guest-plans',
		description: '打开营业预设抽屉，集中查看可能出现的稀客和套餐',
		key: 'special-guest-plan-drawer',
		keywords: [
			'稀客开店预设',
			'开店预设',
			'稀客套餐',
			'营业预设',
			'预设管理',
			'抽屉',
		],
		label: '营业预设',
		sectionLabel: '工具',
	},
	{
		description: '设置稀客页面套餐推荐卡片显示、默认推荐策略和自动推荐参数',
		key: 'special-guest-suggest-meals',
		keywords: [
			'猜您想要',
			'套餐推荐',
			'推荐卡片',
			'推荐数量',
			'排序',
			'策略',
			'推荐策略',
			'默认推荐策略',
			'容易获取',
			'低价',
			'高价',
			'少料易做',
			'评级上限',
			'加料上限',
			'稀客开店预设',
			'开店预设',
			'营业预设',
			'抽屉',
		],
		label: '“猜您想要”推荐设置',
	},
	{
		description: '选择稀客点单需求标签时同步筛选表格',
		key: 'special-guest-order-linked-filter',
		label: '选择点单需求的同时筛选表格',
	},
	{
		description: '显示料理标签所对应的关键词',
		key: 'special-guest-show-tag-description',
		label: '显示料理标签描述',
	},
	{
		description: '导入、导出、备份、还原或重置顾客套餐和营业预设数据',
		key: 'data-manager',
		keywords: [
			'本地导入',
			'本地导出',
			'导入',
			'导出',
			'备份',
			'还原',
			'重置',
			'旧备份码',
			'云端备份',
			'云端还原',
		],
		label: '数据管理',
	},
] as const;

const ACCOUNT_PREFERENCE_SEARCH_ITEMS = [
	{
		action: 'open-account',
		description: '管理账号、同步状态、登录方式和云端数据',
		key: 'account',
		keywords: [
			'账户',
			'小助手账号',
			'账号同步',
			'同步状态',
			'云端数据',
			'账号安全',
		],
		label: '账号',
	},
	{
		action: 'open-account',
		description: '使用用户名密码或通行密钥登录、注册小助手账号',
		key: 'account-login-register',
		keywords: [
			'登录',
			'注册',
			'创建账号',
			'登录账号',
			'用户名',
			'密码',
			'通行密钥',
			'Passkey',
			'WebAuthn',
		],
		label: '登录/注册',
	},
	{
		action: 'open-account',
		description: '设置或修改登录密码，管理通行密钥和登录设备',
		key: 'account-security',
		keywords: [
			'设置登录密码',
			'修改密码',
			'通行密钥',
			'登录设备',
			'退出登录',
			'删除账号',
		],
		label: '账号安全',
	},
	{
		action: 'open-account',
		description: '查看同步状态，处理同步异常或冲突',
		key: 'account-sync',
		keywords: ['同步状态', '云同步', '同步冲突', '同步异常', '立即同步'],
		label: '账号同步',
	},
] as const;

const PREFERENCE_SEARCH_ITEMS_ZH_CN = [
	...BASE_PREFERENCE_SEARCH_ITEMS,
	...ACCOUNT_PREFERENCE_SEARCH_ITEMS,
] as const satisfies ReadonlyArray<{ key: TPreferenceTargetKey }>;

type TPreferenceSearchItemKey =
	(typeof PREFERENCE_SEARCH_ITEMS_ZH_CN)[number]['key'];

const LOCALIZED_PREFERENCE_SEARCH_ITEM_TEXT: Record<
	Exclude<TLocale, 'zh-CN'>,
	Readonly<
		Partial<
			Record<TPreferenceSearchItemKey, ILocalizedPreferenceSearchItemText>
		>
	>
> = {
	en: {
		account: {
			description:
				'Manage your account, sync status, sign-in methods, and cloud data',
			keywords: [
				'account',
				'account sync',
				'sync status',
				'cloud data',
				'account security',
			],
			label: 'Account',
		},
		'account-login-register': {
			description:
				'Sign in or register with username and password or a passkey',
			keywords: [
				'sign in',
				'register',
				'create account',
				'username',
				'password',
				'passkey',
				'WebAuthn',
			],
			label: 'Sign in/Register',
		},
		'account-security': {
			description:
				'Set or change your password, manage passkeys and signed-in devices',
			keywords: [
				'set password',
				'change password',
				'passkey',
				'devices',
				'sign out',
				'delete account',
			],
			label: 'Account security',
		},
		'account-sync': {
			description:
				'Check sync status and resolve sync errors or conflicts',
			keywords: [
				'sync status',
				'cloud sync',
				'sync conflict',
				'sync error',
				'sync now',
			],
			label: 'Account sync',
		},
		'appearance-high-appearance': {
			description: 'Turn smooth scrolling and frosted glass on or off',
			label: 'Smooth scrolling and frosted glass',
		},
		'appearance-tachie': {
			description:
				'Show or hide the character art at the bottom right of guest pages',
			label: 'Character art on guest pages',
		},
		'data-manager': {
			description:
				'Import, export, back up, restore, or reset guest meals and business plans',
			keywords: [
				'import',
				'export',
				'backup',
				'restore',
				'reset',
				'legacy backup code',
				'cloud backup',
				'cloud restore',
			],
			label: 'Data management',
		},
		'experience-tags-tooltip': {
			description: 'Show or hide tag tooltips on guest cards',
			label: 'Tag tooltips',
		},
		'experience-vibrate': {
			description: 'Turn vibration feedback for actions on or off',
			label: 'Vibration feedback',
		},
		'global-hidden-dlcs': {
			description: 'Show or hide each DLC dataset',
			keywords: ['DLC', 'dataset', 'datasets', 'hide DLC'],
			label: 'Datasets',
		},
		'global-popular-trend': {
			description: 'Set the current in-game popular trends',
			keywords: ['popular', 'unpopular', 'famous shop', 'trend'],
			label: 'Popular trends',
		},
		'guest-hidden-items': {
			description:
				'Show or hide the foods, beverages, and ingredients available on guest pages',
			keywords: [
				'hide beverages',
				'hide foods',
				'hide ingredients',
				'show beverages',
				'show foods',
				'show ingredients',
			],
			label: 'Hidden foods/beverages/ingredients',
		},
		'special-guest-order-linked-filter': {
			description:
				'Filter the table while selecting special guest order requirement tags',
			label: 'Filter the table with order requirements',
		},
		'special-guest-plan-drawer': {
			description:
				'Open the business plan drawer to review possible special guests and meals',
			keywords: [
				'business plan',
				'special guest plans',
				'plan drawer',
				'special guest meals',
			],
			label: 'Business plans',
			sectionLabel: 'Tools',
		},
		'special-guest-show-tag-description': {
			description: 'Show the keywords for food tags',
			label: 'Show food tag descriptions',
		},
		'special-guest-suggest-meals': {
			description:
				'Configure meal recommendation cards, the default strategy, and automatic recommendation parameters',
			keywords: [
				'recommendation',
				'recommended meals',
				'recommendation cards',
				'strategy',
				'default strategy',
				'easy to obtain',
				'low price',
				'high price',
				'rating cap',
				'extra ingredient cap',
				'business plan',
			],
			label: '“Guess What You Want” recommendations',
		},
	},
	ja: {
		account: {
			description:
				'アカウント、同期状態、ログイン方法、クラウドデータを管理',
			keywords: [
				'アカウント',
				'アカウント同期',
				'同期状態',
				'クラウドデータ',
				'アカウント安全',
			],
			label: 'アカウント',
		},
		'account-login-register': {
			description:
				'ユーザー名とパスワード、またはパスキーでログイン・登録',
			keywords: [
				'ログイン',
				'登録',
				'アカウント作成',
				'ユーザー名',
				'パスワード',
				'パスキー',
				'WebAuthn',
			],
			label: 'ログイン/登録',
		},
		'account-security': {
			description:
				'ログインパスワードの設定・変更、パスキーとログイン端末の管理',
			keywords: [
				'パスワード設定',
				'パスワード変更',
				'パスキー',
				'ログイン端末',
				'ログアウト',
				'アカウント削除',
			],
			label: 'アカウント安全',
		},
		'account-sync': {
			description: '同期状態の確認、同期エラーや競合の処理',
			keywords: [
				'同期状態',
				'クラウド同期',
				'同期競合',
				'同期エラー',
				'今すぐ同期',
			],
			label: 'アカウント同期',
		},
		'appearance-high-appearance': {
			description: 'スムーズスクロールとすりガラス効果のオン/オフ',
			label: 'スムーズスクロールとすりガラス効果',
		},
		'appearance-tachie': {
			description: 'お客様ページ右下の立ち絵の表示/非表示',
			label: 'お客様ページの立ち絵',
		},
		'data-manager': {
			description:
				'お客様のセットメニューと営業プリセットデータの入出力・バックアップ・復元・リセット',
			keywords: [
				'ローカル入出力',
				'インポート',
				'エクスポート',
				'バックアップ',
				'復元',
				'リセット',
				'旧バックアップコード',
				'クラウドバックアップ',
				'クラウド復元',
			],
			label: 'データ管理',
		},
		'experience-tags-tooltip': {
			description: 'お客様カードのタグのツールチップの表示/非表示',
			label: 'タグのツールチップ',
		},
		'experience-vibrate': {
			description: '操作時の振動フィードバックのオン/オフ',
			label: '振動フィードバック',
		},
		'global-hidden-dlcs': {
			description: '各DLCデータセットの表示/非表示',
			keywords: ['DLC', 'データセット', 'DLC非表示'],
			label: 'データセット',
		},
		'global-popular-trend': {
			description: 'ゲーム内で現在の流行を設定',
			keywords: ['流行', '人気', '不人気', '人気店'],
			label: '流行',
		},
		'guest-hidden-items': {
			description:
				'お客様ページで使用できる料理・お酒・食材の表示/非表示',
			keywords: [
				'お酒を非表示',
				'料理を非表示',
				'食材を非表示',
				'お酒を表示',
				'料理を表示',
				'食材を表示',
			],
			label: '料理/お酒/食材の非表示',
		},
		'special-guest-order-linked-filter': {
			description: 'レア客の注文条件タグの選択と同時にテーブルを絞り込む',
			label: '注文条件と同時にテーブルを絞り込む',
		},
		'special-guest-plan-drawer': {
			description:
				'営業プリセットのドロワーを開き、登場しうるレア客とセットメニューを確認',
			keywords: [
				'営業プリセット',
				'レア客セットメニュー',
				'プリセット管理',
				'ドロワー',
			],
			label: '営業プリセット',
			sectionLabel: 'ツール',
		},
		'special-guest-show-tag-description': {
			description: '料理タグに対応するキーワードを表示',
			label: '料理タグの説明を表示',
		},
		'special-guest-suggest-meals': {
			description:
				'レア客ページのセットメニュー推薦カード、デフォルト推薦方針、自動推薦パラメータを設定',
			keywords: [
				'おすすめ',
				'セットメニュー推薦',
				'推薦カード',
				'推薦数',
				'並び替え',
				'方針',
				'デフォルト方針',
				'入手しやすい',
				'低価格',
				'高価格',
				'材料少なめ',
				'評価の上限',
				'追加食材の上限',
				'営業プリセット',
			],
			label: '「おすすめ」推薦設定',
		},
	},
	ko: {
		account: {
			description: '계정, 동기화 상태, 로그인 방식, 클라우드 데이터 관리',
			keywords: [
				'계정',
				'계정 동기화',
				'동기화 상태',
				'클라우드 데이터',
				'계정 보안',
			],
			label: '계정',
		},
		'account-login-register': {
			description: '사용자 이름과 비밀번호 또는 패스키로 로그인·가입',
			keywords: [
				'로그인',
				'가입',
				'계정 만들기',
				'사용자 이름',
				'비밀번호',
				'패스키',
				'WebAuthn',
			],
			label: '로그인/가입',
		},
		'account-security': {
			description: '로그인 비밀번호 설정·변경, 패스키와 로그인 기기 관리',
			keywords: [
				'비밀번호 설정',
				'비밀번호 변경',
				'패스키',
				'로그인 기기',
				'로그아웃',
				'계정 삭제',
			],
			label: '계정 보안',
		},
		'account-sync': {
			description: '동기화 상태 확인, 동기화 오류·충돌 처리',
			keywords: [
				'동기화 상태',
				'클라우드 동기화',
				'동기화 충돌',
				'동기화 오류',
				'지금 동기화',
			],
			label: '계정 동기화',
		},
		'appearance-high-appearance': {
			description: '부드러운 스크롤과 프로스트 글라스 효과 켜기/끄기',
			label: '부드러운 스크롤과 프로스트 글라스 효과',
		},
		'appearance-tachie': {
			description: '손님 페이지 오른쪽 아래 일러스트 표시/숨기기',
			label: '손님 페이지 일러스트',
		},
		'data-manager': {
			description:
				'손님 세트 메뉴와 영업 프리셋 데이터 가져오기·내보내기·백업·복원·초기화',
			keywords: [
				'가져오기',
				'내보내기',
				'백업',
				'복원',
				'초기화',
				'구 백업 코드',
				'클라우드 백업',
				'클라우드 복원',
			],
			label: '데이터 관리',
		},
		'experience-tags-tooltip': {
			description: '손님 카드 태그 툴팁 표시/숨기기',
			label: '태그 툴팁',
		},
		'experience-vibrate': {
			description: '동작 진동 피드백 켜기/끄기',
			label: '진동 피드백',
		},
		'global-hidden-dlcs': {
			description: '각 DLC 데이터셋 표시/숨기기',
			keywords: ['DLC', '데이터셋', 'DLC 숨기기'],
			label: '데이터셋',
		},
		'global-popular-trend': {
			description: '게임 내 현재 인기 트렌드 설정',
			keywords: ['인기', '비인기', '인기 가게'],
			label: '인기 트렌드',
		},
		'guest-hidden-items': {
			description:
				'손님 페이지에서 사용 가능한 요리·음료·재료 표시/숨기기',
			keywords: [
				'음료 숨기기',
				'요리 숨기기',
				'재료 숨기기',
				'음료 표시',
				'요리 표시',
				'재료 표시',
			],
			label: '요리/음료/재료 숨기기',
		},
		'special-guest-order-linked-filter': {
			description: '희귀 손님 주문 조건 태그 선택과 동시에 표 필터링',
			label: '주문 조건과 동시에 표 필터링',
		},
		'special-guest-plan-drawer': {
			description:
				'영업 프리셋 서랍을 열어 등장 가능한 희귀 손님과 세트 메뉴 확인',
			keywords: [
				'영업 프리셋',
				'희귀 손님 세트 메뉴',
				'프리셋 관리',
				'서랍',
			],
			label: '영업 프리셋',
			sectionLabel: '도구',
		},
		'special-guest-show-tag-description': {
			description: '요리 태그에 대응하는 키워드 표시',
			label: '요리 태그 설명 표시',
		},
		'special-guest-suggest-meals': {
			description:
				'희귀 손님 페이지 세트 메뉴 추천 카드, 기본 추천 방식, 자동 추천 파라미터 설정',
			keywords: [
				'추천',
				'세트 메뉴 추천',
				'추천 카드',
				'추천 수',
				'정렬',
				'방식',
				'기본 방식',
				'구하기 쉬움',
				'저가',
				'고가',
				'재료 적게',
				'평가 상한',
				'추가 재료 상한',
				'영업 프리셋',
			],
			label: '"원하실 것 같아요" 추천 설정',
		},
	},
	'zh-TW': {
		account: {
			description: '管理帳號、同步狀態、登入方式和雲端資料',
			keywords: [
				'帳戶',
				'小助手帳號',
				'帳號同步',
				'同步狀態',
				'雲端資料',
				'帳號安全',
			],
			label: '帳號',
		},
		'account-login-register': {
			description: '使用使用者名稱密碼或通行密鑰登入、註冊小助手帳號',
			keywords: [
				'登入',
				'註冊',
				'建立帳號',
				'登入帳號',
				'使用者名稱',
				'密碼',
				'通行密鑰',
				'Passkey',
				'WebAuthn',
			],
			label: '登入/註冊',
		},
		'account-security': {
			description: '設定或修改登入密碼，管理通行密鑰和登入裝置',
			keywords: [
				'設定登入密碼',
				'修改密碼',
				'通行密鑰',
				'登入裝置',
				'登出',
				'刪除帳號',
			],
			label: '帳號安全',
		},
		'account-sync': {
			description: '查看同步狀態，處理同步異常或衝突',
			keywords: [
				'同步狀態',
				'雲端同步',
				'同步衝突',
				'同步異常',
				'立即同步',
			],
			label: '帳號同步',
		},
		'appearance-high-appearance': {
			description: '開啟或關閉平滑捲動和磨砂效果',
			label: '平滑捲動和磨砂效果',
		},
		'appearance-tachie': {
			description: '顯示或隱藏顧客頁面右下角的立繪',
			label: '顧客頁面右下角的立繪',
		},
		'data-manager': {
			description: '匯入、匯出、備份、還原或重設顧客套餐和營業預設資料',
			keywords: [
				'本地匯入',
				'本地匯出',
				'匯入',
				'匯出',
				'備份',
				'還原',
				'重設',
				'舊備份碼',
				'雲端備份',
				'雲端還原',
			],
			label: '資料管理',
		},
		'experience-tags-tooltip': {
			description: '顯示或隱藏顧客卡片中標籤的浮動提示',
			label: '標籤浮動提示',
		},
		'experience-vibrate': {
			description: '開啟或關閉操作震動回饋',
			label: '操作震動回饋',
		},
		'global-hidden-dlcs': {
			description: '顯示或隱藏各DLC資料集',
			keywords: ['DLC', '資料片', '資料集開關', '隱藏DLC'],
			label: '資料集',
		},
		'global-popular-trend': {
			description: '設定遊戲中現時的流行趨勢',
			keywords: ['流行喜愛', '流行厭惡', '明星店'],
			label: '流行趨勢',
		},
		'guest-hidden-items': {
			description: '顯示或隱藏顧客頁可用的料理、酒水和食材',
			keywords: [
				'隱藏酒水',
				'隱藏料理',
				'隱藏食材',
				'顯示酒水',
				'顯示料理',
				'顯示食材',
			],
			label: '隱藏料理/酒水/食材',
		},
		'special-guest-order-linked-filter': {
			description: '選擇稀客點單需求標籤時同步篩選表格',
			label: '選擇點單需求的同時篩選表格',
		},
		'special-guest-plan-drawer': {
			description: '開啟營業預設抽屜，集中查看可能出現的稀客和套餐',
			keywords: [
				'稀客開店預設',
				'開店預設',
				'稀客套餐',
				'營業預設',
				'預設管理',
				'抽屜',
			],
			label: '營業預設',
			sectionLabel: '工具',
		},
		'special-guest-show-tag-description': {
			description: '顯示料理標籤所對應的關鍵詞',
			label: '顯示料理標籤描述',
		},
		'special-guest-suggest-meals': {
			description:
				'設定稀客頁面套餐推薦卡片顯示、預設推薦策略和自動推薦參數',
			keywords: [
				'猜您想要',
				'套餐推薦',
				'推薦卡片',
				'推薦數量',
				'排序',
				'策略',
				'推薦策略',
				'預設推薦策略',
				'容易取得',
				'低價',
				'高價',
				'少料易做',
				'評級上限',
				'加料上限',
				'稀客開店預設',
				'開店預設',
				'營業預設',
				'抽屜',
			],
			label: '「猜您想要」推薦設定',
		},
	},
};

export const PREFERENCE_SEARCH_ITEMS = PREFERENCE_SEARCH_ITEMS_ZH_CN;

function getPreferenceSearchItems({
	includeAccountItems = true,
}: IPreferenceSearchIndexOptions = {}) {
	return includeAccountItems
		? PREFERENCE_SEARCH_ITEMS
		: BASE_PREFERENCE_SEARCH_ITEMS;
}

export function buildPreferenceSearchIndex(
	options: IPreferenceSearchIndexOptions = {},
	locale: TLocale = DEFAULT_LOCALE
): IGlobalSearchIndexItem[] {
	const localizedText =
		locale === 'zh-CN'
			? undefined
			: LOCALIZED_PREFERENCE_SEARCH_ITEM_TEXT[locale];

	return getPreferenceSearchItems(options).map((item) => {
		const localized = 'key' in item ? localizedText?.[item.key] : undefined;
		const label = localized?.label ?? item.label;
		const description = localized?.description ?? item.description;
		const keywordValues = [
			...(localized?.keywords ??
				('keywords' in item ? item.keywords : [])),
		];
		const keywords = keywordValues.join(' ');
		const navigationAction =
			'action' in item
				? item.action === 'open-account'
					? ({ type: 'open-account' } as const)
					: ({ type: 'open-special-guest-plans' } as const)
				: ({ targetKey: item.key, type: 'open-preference' } as const);

		return {
			description,
			fields: [
				{
					fieldType: 'name',
					label: '名称',
					text: label,
					value: label,
					weight: 5,
				},
				{
					fieldType: 'description',
					label: '说明',
					text: description,
					value: description,
					weight: 2,
				},
				...(keywords.length === 0
					? []
					: [
							{
								fieldType: 'description' as const,
								label: '关键词',
								text: keywords,
								value: keywordValues,
								weight: 1.4,
							},
						]),
			],
			href: '/preferences',
			id: `preferences:${item.key}`,
			name: label,
			navigationAction,
			section: 'preferences',
			sectionLabel:
				localized?.sectionLabel ??
				('sectionLabel' in item ? item.sectionLabel : '设置'),
		};
	});
}
