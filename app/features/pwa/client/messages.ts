import { type TLocalizedMessageTable } from '@/shared/i18n/messages';

const PWA_INSTALL_MESSAGES_ZH_CN = {
	'pwa.install.entry.dismissed': '查看安装步骤',
	'pwa.install.entry.install': '安装到桌面',
	'pwa.install.entry.installing': '正在安装…',
	'pwa.install.entry.openInBrowser': '用浏览器打开',
	'pwa.install.entry.steps': '把{name}装到桌面',
	'pwa.install.entry.timeoutHint': '没看到安装提示？请查看安装步骤。',
	'pwa.install.guide.installedNote':
		'若已安装，可直接从主屏幕或桌面图标打开。',
	'pwa.install.guide.moreInfo': '更多说明：',
	'pwa.install.guide.step.browserMenu':
		'在浏览器菜单中找到“安装应用”或“添加到主屏幕”等类似的选项或图标。若菜单中没有这些选项，请查看下方的“更多说明”。',
	'pwa.install.guide.step.inApp':
		'点击右上角菜单，选择“在浏览器中打开”，然后在浏览器中继续安装。',
	'pwa.install.guide.step.iosOther':
		'在浏览器菜单中寻找“添加到主屏幕”；想要独立窗口体验，建议改用Safari。',
	'pwa.install.guide.step.iosSafari':
		'点击分享按钮，选择“添加到主屏幕”，再点“添加”。',
	'pwa.install.guide.step.safariMacos': '在菜单栏选择“文件”→“添加到程序坞”。',
	'pwa.install.guide.title': '安装到桌面',
	'pwa.install.notice.installed': '已安装，可从主屏幕或桌面图标打开。',
	'pwa.install.nudge.body': '随时随地查图鉴、配套餐',
	'pwa.install.nudge.install': '安装',
	'pwa.install.nudge.later': '以后再说',
	'pwa.install.nudge.title': '把{name}装到桌面',
} as const;

export type TPwaInstallMessageKey = keyof typeof PWA_INSTALL_MESSAGES_ZH_CN;

export const pwaInstallMessages = {
	en: {
		'pwa.install.entry.dismissed': 'View install steps',
		'pwa.install.entry.install': 'Install app',
		'pwa.install.entry.installing': 'Installing…',
		'pwa.install.entry.openInBrowser': 'Open in browser',
		'pwa.install.entry.steps': 'Install {name} as an app',
		'pwa.install.entry.timeoutHint':
			"Didn't see the install prompt? View the install steps.",
		'pwa.install.guide.installedNote':
			'If it is already installed, open it from your home screen or desktop.',
		'pwa.install.guide.moreInfo': 'More information: ',
		'pwa.install.guide.step.browserMenu':
			'Find an option or icon such as "Install app" or "Add to Home Screen" in the browser menu. If the menu does not have these options, see "More information" below.',
		'pwa.install.guide.step.inApp':
			'Open the menu in the top corner, choose "Open in browser", then continue the installation there.',
		'pwa.install.guide.step.iosOther':
			'Look for "Add to Home Screen" in the browser menu. For a standalone window, use Safari.',
		'pwa.install.guide.step.iosSafari':
			'Tap the share button, choose "Add to Home Screen", then tap "Add".',
		'pwa.install.guide.step.safariMacos':
			'In the menu bar, choose File → "Add to Dock".',
		'pwa.install.guide.title': 'Install app',
		'pwa.install.notice.installed':
			'Installed. You can open it from your home screen or desktop.',
		'pwa.install.nudge.body':
			'Look up the catalog and pair meals anytime, anywhere.',
		'pwa.install.nudge.install': 'Install',
		'pwa.install.nudge.later': 'Not now',
		'pwa.install.nudge.title': 'Install {name} as an app',
	},
	ja: {
		'pwa.install.entry.dismissed': 'インストール手順を見る',
		'pwa.install.entry.install': 'アプリをインストール',
		'pwa.install.entry.installing': 'インストール中…',
		'pwa.install.entry.openInBrowser': 'ブラウザで開く',
		'pwa.install.entry.steps': '「{name}」をアプリとしてインストール',
		'pwa.install.entry.timeoutHint':
			'インストールの確認が表示されない場合は、インストール手順をご覧ください。',
		'pwa.install.guide.installedNote':
			'インストール済みの場合は、ホーム画面やデスクトップのアイコンから開けます。',
		'pwa.install.guide.moreInfo': '詳しい説明：',
		'pwa.install.guide.step.browserMenu':
			'ブラウザのメニューで「アプリをインストール」や「ホーム画面に追加」などの項目やアイコンを探します。メニューにこれらの項目がない場合は、下の「詳しい説明」をご覧ください。',
		'pwa.install.guide.step.inApp':
			'右上のメニューから「ブラウザで開く」を選び、ブラウザでインストールを続けます。',
		'pwa.install.guide.step.iosOther':
			'ブラウザのメニューから「ホーム画面に追加」を探します。独立したウィンドウで使いたい場合は、Safariがおすすめです。',
		'pwa.install.guide.step.iosSafari':
			'共有ボタンをタップし、「ホーム画面に追加」を選んで「追加」をタップします。',
		'pwa.install.guide.step.safariMacos':
			'メニューバーの「ファイル」→「Dockに追加」を選びます。',
		'pwa.install.guide.title': 'アプリをインストール',
		'pwa.install.notice.installed':
			'インストールしました。ホーム画面やデスクトップから開けます。',
		'pwa.install.nudge.body':
			'いつでもどこでも、図鑑とセットメニューをチェックできます',
		'pwa.install.nudge.install': 'インストール',
		'pwa.install.nudge.later': '後で',
		'pwa.install.nudge.title': '「{name}」をアプリとしてインストール',
	},
	ko: {
		'pwa.install.entry.dismissed': '설치 단계 보기',
		'pwa.install.entry.install': '앱 설치',
		'pwa.install.entry.installing': '설치 중…',
		'pwa.install.entry.openInBrowser': '브라우저에서 열기',
		'pwa.install.entry.steps': '{name}를 앱으로 설치',
		'pwa.install.entry.timeoutHint':
			'설치 안내가 보이지 않으면 설치 단계를 확인해 주세요.',
		'pwa.install.guide.installedNote':
			'이미 설치했다면 홈 화면이나 바탕 화면 아이콘에서 열 수 있습니다.',
		'pwa.install.guide.moreInfo': '자세한 안내: ',
		'pwa.install.guide.step.browserMenu':
			'브라우저 메뉴에서 "앱 설치" 또는 "홈 화면에 추가"와 비슷한 항목이나 아이콘을 찾아보세요. 메뉴에 해당 항목이 없다면 아래의 "자세한 안내"를 확인하세요.',
		'pwa.install.guide.step.inApp':
			'오른쪽 위 메뉴에서 "브라우저에서 열기"를 선택한 뒤 브라우저에서 설치를 계속하세요.',
		'pwa.install.guide.step.iosOther':
			'브라우저 메뉴에서 "홈 화면에 추가"를 찾아보세요. 독립 창으로 사용하려면 Safari를 권장합니다.',
		'pwa.install.guide.step.iosSafari':
			'공유 버튼을 누르고 "홈 화면에 추가"를 선택한 뒤 "추가"를 누르세요.',
		'pwa.install.guide.step.safariMacos':
			'메뉴 막대에서 "파일" → "Dock에 추가"를 선택하세요.',
		'pwa.install.guide.title': '앱으로 설치',
		'pwa.install.notice.installed':
			'설치되었습니다. 홈 화면이나 바탕 화면에서 열 수 있습니다.',
		'pwa.install.nudge.body':
			'언제 어디서든 도감과 세트 메뉴를 확인할 수 있습니다.',
		'pwa.install.nudge.install': '설치',
		'pwa.install.nudge.later': '나중에',
		'pwa.install.nudge.title': '{name}를 앱으로 설치',
	},
	'zh-CN': PWA_INSTALL_MESSAGES_ZH_CN,
	'zh-TW': {
		'pwa.install.entry.dismissed': '查看安裝步驟',
		'pwa.install.entry.install': '安裝到桌面',
		'pwa.install.entry.installing': '正在安裝…',
		'pwa.install.entry.openInBrowser': '用瀏覽器開啟',
		'pwa.install.entry.steps': '把{name}裝到桌面',
		'pwa.install.entry.timeoutHint': '沒看到安裝提示？請查看安裝步驟。',
		'pwa.install.guide.installedNote':
			'若已安裝，可直接從主畫面或桌面圖示開啟。',
		'pwa.install.guide.moreInfo': '更多說明：',
		'pwa.install.guide.step.browserMenu':
			'在瀏覽器選單中找到「安裝應用程式」或「加到主畫面」等類似的選項或圖示。若選單中沒有這些選項，請查看下方的「更多說明」。',
		'pwa.install.guide.step.inApp':
			'點擊右上角選單，選擇「在瀏覽器開啟」，然後在瀏覽器中繼續安裝。',
		'pwa.install.guide.step.iosOther':
			'在瀏覽器選單中尋找「加入主畫面」；想要獨立視窗體驗，建議改用Safari。',
		'pwa.install.guide.step.iosSafari':
			'點擊分享按鈕，選擇「加入主畫面」，再點「新增」。',
		'pwa.install.guide.step.safariMacos':
			'在選單列選擇「檔案」→「加入Dock」。',
		'pwa.install.guide.title': '安裝到桌面',
		'pwa.install.notice.installed': '已安裝，可從主畫面或桌面圖示開啟。',
		'pwa.install.nudge.body': '隨時隨地查圖鑑、配套餐',
		'pwa.install.nudge.install': '安裝',
		'pwa.install.nudge.later': '以後再說',
		'pwa.install.nudge.title': '把{name}裝到桌面',
	},
} as const satisfies TLocalizedMessageTable<TPwaInstallMessageKey>;
