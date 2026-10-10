import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const ITEM_SHARING_MESSAGES_ZH_CN = {
	'itemSharing.closePopover': '点击：关闭弹出框',
	'itemSharing.closeWindow': '点击：关闭窗口',
	'itemSharing.copyHint': '点击以复制到当前选中项的链接↓',
	'itemSharing.pipLabel': '在画中画中打开',
	'itemSharing.shareLabel': '点击：分享到当前选中项的链接',
	'itemSharing.shareText': '在{site}上查看【{name}】的详情',
} as const;

export type TItemSharingMessageKey = keyof typeof ITEM_SHARING_MESSAGES_ZH_CN;

export const itemSharingMessages = {
	en: {
		'itemSharing.closePopover': 'Click: close the popover',
		'itemSharing.closeWindow': 'Click: close the window',
		'itemSharing.copyHint': 'Click to copy the link of the selected item ↓',
		'itemSharing.pipLabel': 'Open in Picture-in-Picture',
		'itemSharing.shareLabel': 'Click: share the link of the selected item',
		'itemSharing.shareText': 'View {name} on {site}',
	},
	ja: {
		'itemSharing.closePopover': 'クリック：ポップアップを閉じる',
		'itemSharing.closeWindow': 'クリック：ウィンドウを閉じる',
		'itemSharing.copyHint':
			'クリックして選択中の項目のリンクをコピー↓',
		'itemSharing.pipLabel': 'ピクチャーインピクチャーで開く',
		'itemSharing.shareLabel':
			'クリック：選択中の項目のリンクを共有',
		'itemSharing.shareText': '{site}で【{name}】の詳細を見る',
	},
	ko: {
		'itemSharing.closePopover': '클릭: 팝오버 닫기',
		'itemSharing.closeWindow': '클릭: 창 닫기',
		'itemSharing.copyHint': '클릭하여 선택한 항목의 링크 복사 ↓',
		'itemSharing.pipLabel': 'PiP(화면 속 화면)로 열기',
		'itemSharing.shareLabel': '클릭: 선택한 항목의 링크 공유',
		'itemSharing.shareText': '{site}에서 {name} 상세 보기',
	},
	'zh-CN': ITEM_SHARING_MESSAGES_ZH_CN,
	'zh-TW': {
		'itemSharing.closePopover': '點擊：關閉彈出框',
		'itemSharing.closeWindow': '點擊：關閉視窗',
		'itemSharing.copyHint': '點擊以複製到目前選中項目的連結↓',
		'itemSharing.pipLabel': '在子母畫面中開啟',
		'itemSharing.shareLabel': '點擊：分享到目前選中項目的連結',
		'itemSharing.shareText': '在{site}上查看【{name}】的詳情',
	},
} as const satisfies TLocalizedMessageTable<TItemSharingMessageKey>;
