import { type TLocalizedMessageTable } from '@/shared/i18n/messages';

const LOGIN_GATE_MESSAGES_ZH_CN = {
	'loginGate.action.login': '登录账号',
	'loginGate.action.suppress': '本次不再提示',
	'loginGate.count.details.one': '还有{count}项资料',
	'loginGate.count.details.other': '还有{count}项资料',
	'loginGate.count.dialogues.one': '还有{count}条对话',
	'loginGate.count.dialogues.other': '还有{count}条对话',
	'loginGate.count.recommendations.one': '还有{count}组推荐',
	'loginGate.count.recommendations.other': '还有{count}组推荐',
	'loginGate.reason':
		'登录后，账号会同步本设备保存的偏好设置、营业预设和顾客套餐，让其他设备继续使用相同配置。',
	'loginGate.title.catalogItemDetails': '查看完整图鉴资料',
	'loginGate.title.guestDetails': '查看完整顾客资料',
	'loginGate.title.mealSave': '保存这套搭配',
	'loginGate.title.specialGuestPlans': '查看自动推荐套餐',
	'loginGate.title.suggestedMeals': '查看本次推荐结果',
} as const;

export type TLoginGateMessageKey = keyof typeof LOGIN_GATE_MESSAGES_ZH_CN;

export const loginGateMessages = {
	en: {
		'loginGate.action.login': 'Sign in',
		'loginGate.action.suppress': "Don't ask again this session",
		'loginGate.count.details.one': '{count} more entry',
		'loginGate.count.details.other': '{count} more entries',
		'loginGate.count.dialogues.one': '{count} more line',
		'loginGate.count.dialogues.other': '{count} more lines',
		'loginGate.count.recommendations.one': '{count} more suggestion',
		'loginGate.count.recommendations.other': '{count} more suggestions',
		'loginGate.reason':
			'After you sign in, your account syncs the preferences, business plans, and guest meals saved on this device, so your other devices keep the same setup.',
		'loginGate.title.catalogItemDetails': 'See the full entry',
		'loginGate.title.guestDetails': 'See the full guest profile',
		'loginGate.title.mealSave': 'Save this meal',
		'loginGate.title.specialGuestPlans': 'See all suggested meals',
		'loginGate.title.suggestedMeals': 'See all suggestions',
	},
	ja: {
		'loginGate.action.login': 'ログイン',
		'loginGate.action.suppress': '今回は表示しない',
		'loginGate.count.details.one': 'ほか{count}件の情報',
		'loginGate.count.details.other': 'ほか{count}件の情報',
		'loginGate.count.dialogues.one': 'ほか{count}件の会話',
		'loginGate.count.dialogues.other': 'ほか{count}件の会話',
		'loginGate.count.recommendations.one': 'ほか{count}件のおすすめ',
		'loginGate.count.recommendations.other': 'ほか{count}件のおすすめ',
		'loginGate.reason':
			'ログインすると、この端末に保存した設定、営業プリセット、セットメニューがアカウントで同期され、ほかの端末でも同じ構成を使えます。',
		'loginGate.title.catalogItemDetails': '図鑑の情報をすべて見る',
		'loginGate.title.guestDetails': '客の情報をすべて見る',
		'loginGate.title.mealSave': 'このセットメニューを保存',
		'loginGate.title.specialGuestPlans': '自動おすすめをすべて見る',
		'loginGate.title.suggestedMeals': 'おすすめをすべて見る',
	},
	ko: {
		'loginGate.action.login': '로그인',
		'loginGate.action.suppress': '이번에는 다시 표시 안 함',
		'loginGate.count.details.one': '정보 {count}개 더 있음',
		'loginGate.count.details.other': '정보 {count}개 더 있음',
		'loginGate.count.dialogues.one': '대화 {count}개 더 있음',
		'loginGate.count.dialogues.other': '대화 {count}개 더 있음',
		'loginGate.count.recommendations.one': '추천 {count}개 더 있음',
		'loginGate.count.recommendations.other': '추천 {count}개 더 있음',
		'loginGate.reason':
			'로그인하면 이 기기에 저장한 환경 설정, 영업 프리셋, 손님 세트 메뉴가 계정으로 동기화되어 다른 기기에서도 같은 구성을 사용할 수 있습니다.',
		'loginGate.title.catalogItemDetails': '도감 정보 전체 보기',
		'loginGate.title.guestDetails': '손님 정보 전체 보기',
		'loginGate.title.mealSave': '이 세트 메뉴 저장',
		'loginGate.title.specialGuestPlans': '자동 추천 세트 메뉴 전체 보기',
		'loginGate.title.suggestedMeals': '추천 결과 전체 보기',
	},
	'zh-CN': LOGIN_GATE_MESSAGES_ZH_CN,
	'zh-TW': {
		'loginGate.action.login': '登入帳號',
		'loginGate.action.suppress': '本次不再提示',
		'loginGate.count.details.one': '還有{count}項資料',
		'loginGate.count.details.other': '還有{count}項資料',
		'loginGate.count.dialogues.one': '還有{count}條對話',
		'loginGate.count.dialogues.other': '還有{count}條對話',
		'loginGate.count.recommendations.one': '還有{count}組推薦',
		'loginGate.count.recommendations.other': '還有{count}組推薦',
		'loginGate.reason':
			'登入後，帳號會同步本裝置儲存的偏好設定、營業預設和顧客套餐，讓其他裝置繼續使用相同配置。',
		'loginGate.title.catalogItemDetails': '查看完整圖鑑資料',
		'loginGate.title.guestDetails': '查看完整顧客資料',
		'loginGate.title.mealSave': '儲存這套搭配',
		'loginGate.title.specialGuestPlans': '查看自動推薦套餐',
		'loginGate.title.suggestedMeals': '查看本次推薦結果',
	},
} as const satisfies TLocalizedMessageTable<TLoginGateMessageKey>;
