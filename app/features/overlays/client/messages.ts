import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const OVERLAY_COORDINATOR_MESSAGES_ZH_CN = {
	'overlays.preparing.accountBlockerUnavailable':
		'当前版本暂时无法打开账号处理面板，请刷新页面或更新应用。',
	'overlays.preparing.accountSecurity': '正在准备账号安全验证…',
	'overlays.preparing.ariaLabel': '账号阻断状态准备中',
	'overlays.preparing.syncConflict': '正在准备云同步冲突处理…',
} as const;

export type TOverlayCoordinatorMessageKey =
	keyof typeof OVERLAY_COORDINATOR_MESSAGES_ZH_CN;

export const overlayCoordinatorMessages = {
	en: {
		'overlays.preparing.accountBlockerUnavailable':
			'This version of the app cannot open the account panel right now. Please refresh the page or update the app.',
		'overlays.preparing.accountSecurity':
			'Preparing account security verification…',
		'overlays.preparing.ariaLabel': 'Preparing account blocking state',
		'overlays.preparing.syncConflict': 'Preparing sync conflict handling…',
	},
	ja: {
		'overlays.preparing.accountBlockerUnavailable':
			'現在のバージョンではアカウント処理パネルを開けません。ページを再読み込みするか、アプリを更新してください。',
		'overlays.preparing.accountSecurity':
			'アカウントの安全確認を準備しています…',
		'overlays.preparing.ariaLabel': 'アカウント遮断状態を準備しています',
		'overlays.preparing.syncConflict':
			'クラウド同期の競合処理を準備しています…',
	},
	ko: {
		'overlays.preparing.accountBlockerUnavailable':
			'현재 버전에서는 계정 처리 패널을 열 수 없습니다. 페이지를 새로 고치거나 앱을 업데이트해 주세요.',
		'overlays.preparing.accountSecurity': '계정 보안 확인을 준비하는 중…',
		'overlays.preparing.ariaLabel': '계정 차단 상태 준비 중',
		'overlays.preparing.syncConflict':
			'클라우드 동기화 충돌 처리를 준비하는 중…',
	},
	'zh-CN': OVERLAY_COORDINATOR_MESSAGES_ZH_CN,
	'zh-TW': {
		'overlays.preparing.accountBlockerUnavailable':
			'目前版本暫時無法開啟帳號處理面板，請重新整理頁面或更新應用程式。',
		'overlays.preparing.accountSecurity': '正在準備帳號安全驗證…',
		'overlays.preparing.ariaLabel': '帳號阻斷狀態準備中',
		'overlays.preparing.syncConflict': '正在準備雲端同步衝突處理…',
	},
} as const satisfies TLocalizedMessageTable<TOverlayCoordinatorMessageKey>;
