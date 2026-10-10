import type {
	TLocalizedMessageTable,
	TMessageParams,
} from '@/shared/i18n/messages';

const SITE_MESSAGES_ZH_CN = {
	'site.manifest.description':
		'东方夜雀食堂小助手（夜雀助手）是为游戏《东方夜雀食堂》所打造的辅助工具，提供顾客图鉴（包括羁绊奖励和符卡效果查询）、搭配稀客和普客的料理套餐，以及料理（食谱）、酒水、食材、厨具、摆件、衣服、伙伴、货币、道具、唱片、垂钓收藏和徽章查询等功能，旨在为玩家的游玩过程提供帮助。',
	'site.manifest.offlineSuffix': '（离线版）',
	'site.manifest.shortcut.description':
		'搭配稀客的料理套餐或查看顾客图鉴（包括羁绊奖励和符卡效果查询）',
	'site.manifest.shortcut.name': '为稀有顾客搭配料理套餐',
	'site.manifest.shortcut.shortName': '搭配稀客套餐',
	'site.name': '东方夜雀食堂小助手',
	'site.notFound.back': '返回{target}',
	'site.notFound.title': '找不到您所请求的资源',
	'site.runtime.errorTemplate':
		'错误：{message}\n文件：{filename}\n行号：{lineno}，列号：{colno}{stack}',
	'site.runtime.storageWarning':
		'警告：本地存储（localStorage）不可用。\n这可能是因为您正处于无痕或隐身模式下，或浏览器开启了“不允许网站将数据保存在设备上”等类似设置。\n\n本次标签页将改用临时存储。关闭标签页后数据会丢失；如果浏览器也不允许会话存储，刷新页面后数据也会丢失。',
	'site.seo.description.details':
		'本页面可以查询{items}等{name}的详情。{description}',
	'site.seo.description.guestMeals':
		'本页面可以为{items}等{name}搭配料理套餐。{description}',
	'site.seo.description.specialGuests':
		'本页面可以为{items}等{name}搭配料理套餐或查询羁绊奖励和符卡效果。{description}',
	'site.seo.itemSeparator': '、',
	'site.seo.metaMystia.description':
		'MetaMystia是为《东方夜雀食堂》制作的非官方Mod，支持多人联机共同经营食堂；示例资源包新增{guests}位稀客、{foods}道料理、{ingredients}种食材、{beverages}款酒水和{clothes}套服装，并提供皮肤系统与一键安装工具。',
	'site.seo.metaMystia.title': 'MetaMystia - 东方夜雀食堂联机Mod',
	'site.shortName': '夜雀助手',
} as const;

export type TSiteMessageKey = keyof typeof SITE_MESSAGES_ZH_CN;

export type TSiteTranslate = (
	key: TSiteMessageKey,
	params?: TMessageParams
) => string;

export const siteMessages = {
	en: {
		'site.manifest.description':
			"Touhou Mystia's Izakaya Assistant is a companion tool for Touhou Mystia's Izakaya, offering a guest catalog (including bond rewards and spell card effects), meal pairing for special and normal guests, and lookups for foods (recipes), beverages, ingredients, cookware, decorations, clothes, partners, currencies, items, records, fishing collectibles and badges.",
		'site.manifest.offlineSuffix': ' (Offline)',
		'site.manifest.shortcut.description':
			'Pair meals for special guests or browse the guest catalog, including bond rewards and spell card effects',
		'site.manifest.shortcut.name': 'Pair meals for special guests',
		'site.manifest.shortcut.shortName': 'Pair special guest meals',
		'site.name': "Touhou Mystia's Izakaya Assistant",
		'site.notFound.back': 'Back to {target}',
		'site.notFound.title': 'The requested resource was not found',
		'site.runtime.errorTemplate':
			'Error: {message}\nFile: {filename}\nLine: {lineno}, column: {colno}{stack}',
		'site.runtime.storageWarning':
			'Warning: localStorage is unavailable. This may be caused by private/incognito mode or a browser setting that blocks sites from saving data on your device.\n\nThis tab will use temporary storage. Data is lost when the tab closes; if session storage is also unavailable, it is lost on refresh.',
		'site.seo.description.details':
			'Look up details of {name} such as {items}. {description}',
		'site.seo.description.guestMeals':
			'Pair meals for {name} such as {items}. {description}',
		'site.seo.description.specialGuests':
			'Pair meals for {name} such as {items}, or look up bond rewards and spell card effects. {description}',
		'site.seo.itemSeparator': ', ',
		'site.seo.metaMystia.description':
			"MetaMystia is an unofficial mod for Touhou Mystia's Izakaya that supports multiplayer co-op management of the izakaya. Its sample resource pack adds {guests} special guests, {foods} foods, {ingredients} ingredients, {beverages} beverages, and {clothes} outfits, plus a skin system and a one-click installer.",
		'site.seo.metaMystia.title':
			"MetaMystia - Touhou Mystia's Izakaya Multiplayer Mod",
		'site.shortName': 'Mystia Assistant',
	},
	ja: {
		'site.manifest.description':
			'『東方夜雀食堂』の攻略補助ツール「夜雀助手」。お客様図鑑（絆報酬・スペルカード効果を含む）、レア客・一般客のセットメニュー構成、料理（レシピ）、飲み物、食材、調理器具、置物、衣装、仲間、通貨、アイテム、レコード、釣りコレクション、バッジなどの検索機能を提供します。',
		'site.manifest.offlineSuffix': '（オフライン版）',
		'site.manifest.shortcut.description':
			'レア客のセットメニュー構成や図鑑（絆報酬・スペルカード効果を含む）を確認',
		'site.manifest.shortcut.name': 'レア客のセットメニューを組む',
		'site.manifest.shortcut.shortName': 'レア客セットメニュー',
		'site.name': '東方夜雀食堂助手',
		'site.notFound.back': '{target}に戻る',
		'site.notFound.title': 'お探しのリソースは見つかりません',
		'site.runtime.errorTemplate':
			'エラー：{message}\nファイル：{filename}\n行：{lineno}、列：{colno}{stack}',
		'site.runtime.storageWarning':
			'警告：localStorageが利用できません。シークレットモードや「サイトにデータの保存を許可しない」設定などが原因の可能性があります。\n\nこのタブでは一時ストレージを使用します。タブを閉じるとデータは失われ、セッションストレージも利用できない場合は再読み込みでも失われます。',
		'site.seo.description.details':
			'このページでは{items}などの{name}の詳細を確認できます。{description}',
		'site.seo.description.guestMeals':
			'このページでは{items}などの{name}のセットメニューを組み立てられます。{description}',
		'site.seo.description.specialGuests':
			'このページでは{items}などの{name}のセットメニューを組み立てたり、絆報酬やスペルカード効果を確認できます。{description}',
		'site.seo.itemSeparator': '、',
		'site.seo.metaMystia.description':
			'MetaMystiaは『東方夜雀食堂』向けの非公式Modで、マルチプレイでの共同経営に対応します。サンプルリソースパックでは{guests}人のレア客、{foods}品の料理、{ingredients}種の食材、{beverages}種の飲み物、{clothes}着の衣装を追加し、スキンシステムとワンクリックインストーラーも提供します。',
		'site.seo.metaMystia.title': 'MetaMystia - 東方夜雀食堂マルチプレイMod',
		'site.shortName': '夜雀助手',
	},
	ko: {
		'site.manifest.description':
			"'동방야작식당'의 보조 도구인 밤참새 도우미입니다. 손님 도감(유대 보상·스펠 카드 효과 포함), 레어 손님·일반 손님 세트 메뉴 구성, 요리(레시피), 음료, 재료, 조리도구, 장식품, 의상, 동료, 화폐, 아이템, 레코드, 낚시 수집품, 배지 조회 기능을 제공합니다.",
		'site.manifest.offlineSuffix': ' (오프라인 버전)',
		'site.manifest.shortcut.description':
			'레어 손님 세트 메뉴 구성 또는 도감(유대 보상·스펠 카드 효과 포함) 확인',
		'site.manifest.shortcut.name': '레어 손님 세트 메뉴 구성',
		'site.manifest.shortcut.shortName': '레어 손님 세트 메뉴',
		'site.name': '동방 야작식당 도우미',
		'site.notFound.back': '{target}(으)로 돌아가기',
		'site.notFound.title': '요청하신 리소스를 찾을 수 없습니다',
		'site.runtime.errorTemplate':
			'오류: {message}\n파일: {filename}\n줄: {lineno}, 열: {colno}{stack}',
		'site.runtime.storageWarning':
			'경고: localStorage를 사용할 수 없습니다. 시크릿 모드이거나 사이트의 데이터 저장을 차단하는 브라우저 설정 때문일 수 있습니다.\n\n이 탭은 임시 저장소를 사용합니다. 탭을 닫으면 데이터가 사라지며, 세션 저장소도 사용할 수 없으면 새로 고침 시에도 사라집니다.',
		'site.seo.description.details':
			'이 페이지에서는 {items} 등 {name}의 상세 정보를 확인할 수 있습니다. {description}',
		'site.seo.description.guestMeals':
			'이 페이지에서는 {items} 등 {name}의 세트 메뉴를 구성할 수 있습니다. {description}',
		'site.seo.description.specialGuests':
			'이 페이지에서는 {items} 등 {name}의 세트 메뉴를 구성하거나 유대 보상과 스펠 카드 효과를 확인할 수 있습니다. {description}',
		'site.seo.itemSeparator': ', ',
		'site.seo.metaMystia.description':
			"MetaMystia는 '동방야작식당'을 위한 비공식 모드로, 멀티플레이 협동 경영을 지원합니다. 예시 리소스 팩은 레어 손님 {guests}명, 요리 {foods}종, 재료 {ingredients}종, 음료 {beverages}종, 의상 {clothes}종을 추가하며 스킨 시스템과 원클릭 설치 도구를 제공합니다.",
		'site.seo.metaMystia.title':
			'MetaMystia - 동방야작식당 멀티플레이 모드',
		'site.shortName': '밤참새 도우미',
	},
	'zh-CN': SITE_MESSAGES_ZH_CN,
	'zh-TW': {
		'site.manifest.description':
			'東方夜雀食堂小助手（夜雀助手）是為遊戲《東方夜雀食堂》打造的輔助工具，提供顧客圖鑑（包括羈絆獎勵和符卡效果查詢）、搭配稀客和普客的料理套餐，以及料理（食譜）、酒水、食材、廚具、擺件、衣服、夥伴、貨幣、道具、唱片、垂釣收藏和徽章查詢等功能，旨在為玩家的遊玩過程提供幫助。',
		'site.manifest.offlineSuffix': '（離線版）',
		'site.manifest.shortcut.description':
			'搭配稀客的料理套餐或查看顧客圖鑑（包括羈絆獎勵和符卡效果查詢）',
		'site.manifest.shortcut.name': '為稀客搭配料理套餐',
		'site.manifest.shortcut.shortName': '搭配稀客套餐',
		'site.name': '東方夜雀食堂小助手',
		'site.notFound.back': '返回{target}',
		'site.notFound.title': '找不到您所請求的資源',
		'site.runtime.errorTemplate':
			'錯誤：{message}\n檔案：{filename}\n行號：{lineno}，列號：{colno}{stack}',
		'site.runtime.storageWarning':
			'警告：本機儲存（localStorage）無法使用。\n這可能是因為您正處於無痕模式，或瀏覽器開啟了「不允許網站將資料儲存在裝置上」等類似設定。\n\n本次分頁將改用臨時儲存。關閉分頁後資料會遺失；如果瀏覽器也不允許工作階段儲存，重新整理頁面後資料也會遺失。',
		'site.seo.description.details':
			'本頁面可以查詢{items}等{name}的詳情。{description}',
		'site.seo.description.guestMeals':
			'本頁面可以為{items}等{name}搭配料理套餐。{description}',
		'site.seo.description.specialGuests':
			'本頁面可以為{items}等{name}搭配料理套餐或查詢羈絆獎勵和符卡效果。{description}',
		'site.seo.itemSeparator': '、',
		'site.seo.metaMystia.description':
			'MetaMystia是為《東方夜雀食堂》製作的非官方Mod，支援多人連線共同經營食堂；示例資源包新增{guests}位稀客、{foods}道料理、{ingredients}種食材、{beverages}款酒水和{clothes}套服裝，並提供皮膚系統與一鍵安裝工具。',
		'site.seo.metaMystia.title': 'MetaMystia - 東方夜雀食堂連線Mod',
		'site.shortName': '夜雀助手',
	},
} as const satisfies TLocalizedMessageTable<TSiteMessageKey>;
