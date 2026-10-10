import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const PREFERENCES_MESSAGES_ZH_CN = {
	'preferences.appearance.highAppearance': '平滑滚动和磨砂效果',
	'preferences.appearance.highAppearance.disableAria':
		'关闭平滑滚动和磨砂效果',
	'preferences.appearance.highAppearance.enableAria':
		'开启平滑滚动和磨砂效果',
	'preferences.appearance.highAppearance.notePerf':
		'（如因浏览器性能受限而感卡顿可关闭）',
	'preferences.appearance.highAppearance.noteReload':
		'（开启或关闭平滑滚动需刷新页面生效）',
	'preferences.appearance.tachie': '顾客页面右下角的立绘',
	'preferences.appearance.tachie.hideAria': '隐藏顾客页面立绘',
	'preferences.appearance.tachie.note': '（宽屏可见）',
	'preferences.appearance.tachie.showAria': '显示顾客页面立绘',
	'preferences.catalog.orderLinked.disabledAria':
		'选择点单需求标签的同时筛选表格',
	'preferences.catalog.orderLinked.enabledAria':
		'选择点单需求标签的同时不筛选表格',
	'preferences.catalog.orderLinked.label': '选择点单需求的同时筛选表格',
	'preferences.catalog.tagDescription.hideAria': '隐藏料理标签描述',
	'preferences.catalog.tagDescription.label': '显示料理标签所对应的关键词',
	'preferences.catalog.tagDescription.showAria': '显示料理标签描述',
	'preferences.cloud.autoGenerateNote':
		'（下次备份时将自动生成，请自行保存至他处）',
	'preferences.cloud.closeParen': '）',
	'preferences.cloud.codeValidity':
		'备份码有效期为180天，每次使用后会自动续期，逾期将自动失效',
	'preferences.cloud.copyTip': '点击以复制备份码',
	'preferences.cloud.currentCode': '当前备份码：',
	'preferences.cloud.delete': '删除云备份',
	'preferences.cloud.delete.fail': '删除失败',
	'preferences.cloud.delete.success': '删除成功',
	'preferences.cloud.deleting': '正在删除数据',
	'preferences.cloud.download': '还原云备份',
	'preferences.cloud.download.fail': '还原失败',
	'preferences.cloud.download.success': '还原成功',
	'preferences.cloud.downloadedAt': '下载于',
	'preferences.cloud.downloading': '正在获取数据',
	'preferences.cloud.format.parens': '（{message}）',
	'preferences.cloud.format.suffix': '（{message}）',
	'preferences.cloud.message.busy': '备份正在处理中，请稍后重试',
	'preferences.cloud.message.codeInfoFailed': '获取备份码信息失败',
	'preferences.cloud.message.codeNotFound':
		'云端未记录此备份码，可能已于他处删除？',
	'preferences.cloud.message.invalidCode': '无效的备份码',
	'preferences.cloud.message.targetNotFound': '目标文件不存在',
	'preferences.cloud.networkError': '（网络错误）',
	'preferences.cloud.neverDownloaded': '尚未被下载过',
	'preferences.cloud.none': '无',
	'preferences.cloud.promptCode': '请输入已有备份码',
	'preferences.cloud.retry': '请{minutes}分钟后再试',
	'preferences.cloud.separator': '，',
	'preferences.cloud.updatedAt': '（更新于',
	'preferences.cloud.upload': '备份至云端',
	'preferences.cloud.upload.fail': '上传失败',
	'preferences.cloud.upload.success': '上传成功',
	'preferences.cloud.uploading': '正在上传数据',
	'preferences.cloud.viewCode': '点此查看',
	'preferences.dataManager.subTitle': '备份/还原/重置顾客套餐和营业预设数据',
	'preferences.dataManager.tab.cloud': '云端备份/还原',
	'preferences.dataManager.tab.legacy': '旧备份码导入',
	'preferences.dataManager.tab.local': '本地导入/导出',
	'preferences.dataManager.tab.reset': '重置',
	'preferences.dataManager.tabsAria': '数据管理选项卡',
	'preferences.dataManager.title': '数据管理',
	'preferences.experience.tagsTooltip': '顾客卡片中标签的浮动提示',
	'preferences.experience.tagsTooltip.hideAria': '隐藏标签浮动提示',
	'preferences.experience.tagsTooltip.note': '（鼠标悬停可见）',
	'preferences.experience.tagsTooltip.showAria': '显示标签浮动提示',
	'preferences.experience.vibrate': '部分操作的震动反馈',
	'preferences.experience.vibrate.disableAria': '关闭操作震动反馈',
	'preferences.experience.vibrate.enableAria': '开启操作震动反馈',
	'preferences.experience.vibrate.note': '（需设备和浏览器支持）',
	'preferences.global.dataset.hideAria': '隐藏{label}数据集',
	'preferences.global.dataset.showAria': '显示{label}数据集',
	'preferences.global.dataset.subTitle':
		'关闭未拥有的数据集以隐藏仅在对应数据集中出现或可以获取的内容',
	'preferences.global.dataset.title': '数据集',
	'preferences.global.famousShop': '“明星店”效果',
	'preferences.global.famousShop.disableAria': '关闭“明星店”效果',
	'preferences.global.famousShop.enableAria': '开启“明星店”效果',
	'preferences.global.famousShop.rewardSuffix': '奖励符卡',
	'preferences.global.popularTrend.category': '类别：',
	'preferences.global.popularTrend.clear': '清除选择',
	'preferences.global.popularTrend.selectAria': '选择游戏中现时流行的标签',
	'preferences.global.popularTrend.subTitle':
		'正确设置游戏中现时的流行趋势可以使套餐评级更为准确',
	'preferences.global.popularTrend.switchAria': '设置为{tag}',
	'preferences.global.popularTrend.tag': '标签：',
	'preferences.global.popularTrend.title': '流行趋势',
	'preferences.hidden.beverages': '启用或禁用特定酒水',
	'preferences.hidden.dlcToggleHideAria': '隐藏{label}的全部项目',
	'preferences.hidden.dlcToggleShowAria': '显示{label}的全部项目',
	'preferences.hidden.foodHiddenNote': '此料理因包含已被隐藏的食材而被隐藏',
	'preferences.hidden.foods': '启用或禁用特定料理',
	'preferences.hidden.groupHiddenNote':
		'此分组下的所有料理均因包含已被隐藏的食材而被隐藏',
	'preferences.hidden.ingredients': '启用或禁用特定食材',
	'preferences.hidden.itemHideAria': '隐藏{name}',
	'preferences.hidden.itemShowAria': '显示{name}',
	'preferences.hidden.openSettings': '打开设置',
	'preferences.language.section': '语言',
	'preferences.local.apply': '应用到本设备',
	'preferences.local.cancel': '取消',
	'preferences.local.confirmApply': '确认应用',
	'preferences.local.copyTip': '点击以复制当前的顾客套餐和营业预设数据',
	'preferences.local.export': '导出',
	'preferences.local.exporting': '尝试唤起下载器',
	'preferences.local.exportTip':
		'如无响应，请检查浏览器权限、设置和浏览器扩展程序',
	'preferences.local.importPlaceholder':
		'从本地文件导入或输入顾客套餐和营业预设数据',
	'preferences.local.selectFile': '选择本地文件',
	'preferences.locale.system': '系统语言（跟随浏览器）',
	'preferences.palette.section': '主题配色',
	'preferences.recommendation.card': '稀客页面套餐推荐卡片',
	'preferences.recommendation.card.disableAria': '关闭稀客页面套餐推荐卡片',
	'preferences.recommendation.card.enableAria': '开启稀客页面套餐推荐卡片',
	'preferences.recommendation.maxExtraIngredients': '加料上限：',
	'preferences.recommendation.maxExtraIngredients.aria':
		'选择自动推荐套餐的额外食材上限',
	'preferences.recommendation.maxRating': '评级上限：',
	'preferences.recommendation.maxRating.aria': '选择自动推荐套餐的最高评级',
	'preferences.recommendation.maxResults': '最多推荐：',
	'preferences.recommendation.maxResults.aria': '选择自动推荐的最多套餐数量',
	'preferences.recommendation.note':
		'推荐参数会影响稀客页面套餐推荐卡片和营业预设的自动推荐结果',
	'preferences.recommendation.sortProfile': '默认推荐策略：',
	'preferences.recommendation.sortProfile.aria': '选择自动推荐的默认推荐策略',
	'preferences.recommendation.unlimited': '不限',
	'preferences.reset.cancel': '取消重置',
	'preferences.reset.confirm': '确认重置',
	'preferences.reset.meals': '重置已保存的顾客套餐数据',
	'preferences.reset.plans': '重置已保存的营业预设数据',
	'preferences.reset.tutorial': '重新进入稀客套餐搭配教程',
	'preferences.section.appearance': '外观',
	'preferences.section.catalog': '顾客页面',
	'preferences.section.catalog.items': '酒水、料理和食材',
	'preferences.section.catalog.specialGuest': '稀客卡片',
	'preferences.section.experience': '体验',
	'preferences.section.global': '全局设置',
	'preferences.section.recommendation': '“猜您想要”推荐',
	'preferences.subtitle': '以下所有的更改都会即时生效',
	'preferences.switch.off': '关',
	'preferences.switch.on': '开',
	'preferences.theme.section': '主题',
	'preferences.title': '设置',
} as const;

export type TPreferencesMessageKey = keyof typeof PREFERENCES_MESSAGES_ZH_CN;

export const preferencesMessages = {
	en: {
		'preferences.appearance.highAppearance':
			'Smooth scrolling and frosted glass',
		'preferences.appearance.highAppearance.disableAria':
			'Disable smooth scrolling and frosted glass',
		'preferences.appearance.highAppearance.enableAria':
			'Enable smooth scrolling and frosted glass',
		'preferences.appearance.highAppearance.notePerf':
			'(Turn off if your browser feels sluggish due to performance limits)',
		'preferences.appearance.highAppearance.noteReload':
			'(Toggling smooth scrolling takes effect after a page reload)',
		'preferences.appearance.tachie':
			'Character art at the bottom right of guest pages',
		'preferences.appearance.tachie.hideAria':
			'Hide guest page character art',
		'preferences.appearance.tachie.note': '(Visible on wide screens)',
		'preferences.appearance.tachie.showAria':
			'Show guest page character art',
		'preferences.catalog.orderLinked.disabledAria':
			'Filter the table when selecting order requirement tags',
		'preferences.catalog.orderLinked.enabledAria':
			'Do not filter the table when selecting order requirement tags',
		'preferences.catalog.orderLinked.label':
			'Filter the table when selecting order requirements',
		'preferences.catalog.tagDescription.hideAria':
			'Hide food tag descriptions',
		'preferences.catalog.tagDescription.label':
			'Show the keywords for food tags',
		'preferences.catalog.tagDescription.showAria':
			'Show food tag descriptions',
		'preferences.cloud.autoGenerateNote':
			'(Generated automatically at the next backup; save it somewhere yourself)',
		'preferences.cloud.closeParen': ')',
		'preferences.cloud.codeValidity':
			'Backup codes are valid for 180 days, renew automatically after each use, and expire once overdue',
		'preferences.cloud.copyTip': 'Click to copy the backup code',
		'preferences.cloud.currentCode': 'Current backup code:',
		'preferences.cloud.delete': 'Delete cloud backup',
		'preferences.cloud.delete.fail': 'Delete failed',
		'preferences.cloud.delete.success': 'Deleted',
		'preferences.cloud.deleting': 'Deleting data',
		'preferences.cloud.download': 'Restore cloud backup',
		'preferences.cloud.download.fail': 'Restore failed',
		'preferences.cloud.download.success': 'Restored',
		'preferences.cloud.downloadedAt': 'Downloaded at',
		'preferences.cloud.downloading': 'Fetching data',
		'preferences.cloud.format.parens': '({message})',
		'preferences.cloud.format.suffix': ' ({message})',
		'preferences.cloud.message.busy':
			'The backup is being processed; try again later',
		'preferences.cloud.message.codeInfoFailed':
			'Failed to get backup code info',
		'preferences.cloud.message.codeNotFound':
			'This backup code is not recorded in the cloud; it may have been deleted elsewhere',
		'preferences.cloud.message.invalidCode': 'Invalid backup code',
		'preferences.cloud.message.targetNotFound':
			'The target file does not exist',
		'preferences.cloud.networkError': ' (Network error)',
		'preferences.cloud.neverDownloaded': 'Not downloaded yet',
		'preferences.cloud.none': 'None',
		'preferences.cloud.promptCode': 'Enter an existing backup code',
		'preferences.cloud.retry': 'Try again in {minutes} minutes',
		'preferences.cloud.separator': ', ',
		'preferences.cloud.updatedAt': '(Updated ',
		'preferences.cloud.upload': 'Back up to cloud',
		'preferences.cloud.upload.fail': 'Upload failed',
		'preferences.cloud.upload.success': 'Uploaded',
		'preferences.cloud.uploading': 'Uploading data',
		'preferences.cloud.viewCode': 'View',
		'preferences.dataManager.subTitle':
			'Back up, restore, or reset saved guest meals and business plans',
		'preferences.dataManager.tab.cloud': 'Cloud backup/restore',
		'preferences.dataManager.tab.legacy': 'Legacy backup code import',
		'preferences.dataManager.tab.local': 'Local import/export',
		'preferences.dataManager.tab.reset': 'Reset',
		'preferences.dataManager.tabsAria': 'Data management tabs',
		'preferences.dataManager.title': 'Data management',
		'preferences.experience.tagsTooltip': 'Tag tooltips on guest cards',
		'preferences.experience.tagsTooltip.hideAria': 'Hide tag tooltips',
		'preferences.experience.tagsTooltip.note': '(Visible on mouse hover)',
		'preferences.experience.tagsTooltip.showAria': 'Show tag tooltips',
		'preferences.experience.vibrate': 'Vibration feedback for some actions',
		'preferences.experience.vibrate.disableAria':
			'Disable vibration feedback',
		'preferences.experience.vibrate.enableAria':
			'Enable vibration feedback',
		'preferences.experience.vibrate.note':
			'(Requires device and browser support)',
		'preferences.global.dataset.hideAria': 'Hide the {label} dataset',
		'preferences.global.dataset.showAria': 'Show the {label} dataset',
		'preferences.global.dataset.subTitle':
			'Turn off datasets you do not own to hide content that only appears in or can be obtained from them',
		'preferences.global.dataset.title': 'Datasets',
		'preferences.global.famousShop': '“Famous Shop” effect',
		'preferences.global.famousShop.disableAria':
			'Disable the “Famous Shop” effect',
		'preferences.global.famousShop.enableAria':
			'Enable the “Famous Shop” effect',
		'preferences.global.famousShop.rewardSuffix': ' reward spell card',
		'preferences.global.popularTrend.category': 'Type:',
		'preferences.global.popularTrend.clear': 'Clear selection',
		'preferences.global.popularTrend.selectAria':
			'Select the current in-game popular tag',
		'preferences.global.popularTrend.subTitle':
			'Setting the current in-game popular trends correctly makes meal ratings more accurate',
		'preferences.global.popularTrend.switchAria': 'Set to {tag}',
		'preferences.global.popularTrend.tag': 'Tag:',
		'preferences.global.popularTrend.title': 'Popular trends',
		'preferences.hidden.beverages': 'Enable or disable specific beverages',
		'preferences.hidden.dlcToggleHideAria': 'Hide all items in {label}',
		'preferences.hidden.dlcToggleShowAria': 'Show all items in {label}',
		'preferences.hidden.foodHiddenNote':
			'This food is hidden because it contains hidden ingredients',
		'preferences.hidden.foods': 'Enable or disable specific foods',
		'preferences.hidden.groupHiddenNote':
			'All foods in this group are hidden because they contain hidden ingredients',
		'preferences.hidden.ingredients':
			'Enable or disable specific ingredients',
		'preferences.hidden.itemHideAria': 'Hide {name}',
		'preferences.hidden.itemShowAria': 'Show {name}',
		'preferences.hidden.openSettings': 'Open settings',
		'preferences.language.section': 'Language',
		'preferences.local.apply': 'Apply to this device',
		'preferences.local.cancel': 'Cancel',
		'preferences.local.confirmApply': 'Confirm apply',
		'preferences.local.copyTip':
			'Click to copy the current guest meals and business plans',
		'preferences.local.export': 'Export',
		'preferences.local.exporting': 'Trying to open the download prompt',
		'preferences.local.exportTip':
			'If nothing happens, check your browser permissions, settings, and extensions',
		'preferences.local.importPlaceholder':
			'Import from a local file or paste guest meals and business plans',
		'preferences.local.selectFile': 'Choose local file',
		'preferences.locale.system': 'System language (follow browser)',
		'preferences.palette.section': 'Theme colors',
		'preferences.recommendation.card':
			'Meal recommendation cards on special guest pages',
		'preferences.recommendation.card.disableAria':
			'Disable meal recommendation cards on special guest pages',
		'preferences.recommendation.card.enableAria':
			'Enable meal recommendation cards on special guest pages',
		'preferences.recommendation.maxExtraIngredients':
			'Extra ingredients cap:',
		'preferences.recommendation.maxExtraIngredients.aria':
			'Select the extra ingredient cap for recommended meals',
		'preferences.recommendation.maxRating': 'Rating cap:',
		'preferences.recommendation.maxRating.aria':
			'Select the maximum rating for recommended meals',
		'preferences.recommendation.maxResults': 'Max recommendations:',
		'preferences.recommendation.maxResults.aria':
			'Select the maximum number of recommended meals',
		'preferences.recommendation.note':
			'Recommendation parameters affect meal recommendation cards on special guest pages and automatic recommendations in business plans',
		'preferences.recommendation.sortProfile': 'Default strategy:',
		'preferences.recommendation.sortProfile.aria':
			'Select the default strategy for automatic recommendations',
		'preferences.recommendation.unlimited': 'Unlimited',
		'preferences.reset.cancel': 'Cancel reset',
		'preferences.reset.confirm': 'Confirm reset',
		'preferences.reset.meals': 'Reset saved guest meal data',
		'preferences.reset.plans': 'Reset saved business plan data',
		'preferences.reset.tutorial':
			'Restart the special guest meal pairing tutorial',
		'preferences.section.appearance': 'Appearance',
		'preferences.section.catalog': 'Guest pages',
		'preferences.section.catalog.items':
			'Beverages, foods, and ingredients',
		'preferences.section.catalog.specialGuest': 'Special guest cards',
		'preferences.section.experience': 'Experience',
		'preferences.section.global': 'Global settings',
		'preferences.section.recommendation':
			'“Guess What You Want” recommendations',
		'preferences.subtitle': 'All changes take effect immediately',
		'preferences.switch.off': 'Off',
		'preferences.switch.on': 'On',
		'preferences.theme.section': 'Theme',
		'preferences.title': 'Settings',
	},
	ja: {
		'preferences.appearance.highAppearance':
			'スムーズスクロールとすりガラス効果',
		'preferences.appearance.highAppearance.disableAria':
			'スムーズスクロールとすりガラス効果を無効にする',
		'preferences.appearance.highAppearance.enableAria':
			'スムーズスクロールとすりガラス効果を有効にする',
		'preferences.appearance.highAppearance.notePerf':
			'（ブラウザの性能不足でカクつく場合はオフにできます）',
		'preferences.appearance.highAppearance.noteReload':
			'（スムーズスクロールの切り替えはページの再読み込みで反映されます）',
		'preferences.appearance.tachie': 'お客様ページ右下の立ち絵',
		'preferences.appearance.tachie.hideAria':
			'お客様ページの立ち絵を非表示',
		'preferences.appearance.tachie.note': '（ワイド画面で表示）',
		'preferences.appearance.tachie.showAria': 'お客様ページの立ち絵を表示',
		'preferences.catalog.orderLinked.disabledAria':
			'注文条件タグの選択と同時にテーブルを絞り込む',
		'preferences.catalog.orderLinked.enabledAria':
			'注文条件タグの選択と同時にテーブルを絞り込まない',
		'preferences.catalog.orderLinked.label':
			'注文条件の選択と同時にテーブルを絞り込む',
		'preferences.catalog.tagDescription.hideAria': '料理タグの説明を非表示',
		'preferences.catalog.tagDescription.label':
			'料理タグに対応するキーワードを表示する',
		'preferences.catalog.tagDescription.showAria': '料理タグの説明を表示',
		'preferences.cloud.autoGenerateNote':
			'（次回のバックアップ時に自動生成されます。ご自身で他へ保存してください）',
		'preferences.cloud.closeParen': '）',
		'preferences.cloud.codeValidity':
			'バックアップコードの有効期限は180日で、使用するたびに自動更新され、期限を過ぎると失効します',
		'preferences.cloud.copyTip': 'クリックしてバックアップコードをコピー',
		'preferences.cloud.currentCode': '現在のバックアップコード：',
		'preferences.cloud.delete': 'クラウドバックアップを削除',
		'preferences.cloud.delete.fail': '削除に失敗しました',
		'preferences.cloud.delete.success': '削除しました',
		'preferences.cloud.deleting': 'データを削除中',
		'preferences.cloud.download': 'クラウドバックアップを復元',
		'preferences.cloud.download.fail': '復元に失敗しました',
		'preferences.cloud.download.success': '復元しました',
		'preferences.cloud.downloadedAt': 'ダウンロード日時',
		'preferences.cloud.downloading': 'データを取得中',
		'preferences.cloud.format.parens': '（{message}）',
		'preferences.cloud.format.suffix': '（{message}）',
		'preferences.cloud.message.busy':
			'バックアップを処理中です。しばらくしてから再試行してください',
		'preferences.cloud.message.codeInfoFailed':
			'バックアップコード情報の取得に失敗しました',
		'preferences.cloud.message.codeNotFound':
			'クラウドにこのバックアップコードの記録がありません。別の場所で削除された可能性があります',
		'preferences.cloud.message.invalidCode': '無効なバックアップコードです',
		'preferences.cloud.message.targetNotFound':
			'対象ファイルが存在しません',
		'preferences.cloud.networkError': '（ネットワークエラー）',
		'preferences.cloud.neverDownloaded': 'まだダウンロードされていません',
		'preferences.cloud.none': 'なし',
		'preferences.cloud.promptCode':
			'既存のバックアップコードを入力してください',
		'preferences.cloud.retry': '{minutes}分後に再試行してください',
		'preferences.cloud.separator': '、',
		'preferences.cloud.updatedAt': '（更新日時',
		'preferences.cloud.upload': 'クラウドへバックアップ',
		'preferences.cloud.upload.fail': 'アップロードに失敗しました',
		'preferences.cloud.upload.success': 'アップロードしました',
		'preferences.cloud.uploading': 'データをアップロード中',
		'preferences.cloud.viewCode': '表示',
		'preferences.dataManager.subTitle':
			'お客様のセットメニューと営業プリセットデータのバックアップ・復元・リセット',
		'preferences.dataManager.tab.cloud': 'クラウドバックアップ/復元',
		'preferences.dataManager.tab.legacy': '旧バックアップコードの読み込み',
		'preferences.dataManager.tab.local': 'ローカル入出力',
		'preferences.dataManager.tab.reset': 'リセット',
		'preferences.dataManager.tabsAria': 'データ管理タブ',
		'preferences.dataManager.title': 'データ管理',
		'preferences.experience.tagsTooltip':
			'お客様カードのタグのツールチップ',
		'preferences.experience.tagsTooltip.hideAria':
			'タグのツールチップを非表示',
		'preferences.experience.tagsTooltip.note': '（マウスオーバーで表示）',
		'preferences.experience.tagsTooltip.showAria':
			'タグのツールチップを表示',
		'preferences.experience.vibrate': '一部操作の振動フィードバック',
		'preferences.experience.vibrate.disableAria':
			'操作時の振動フィードバックを無効にする',
		'preferences.experience.vibrate.enableAria':
			'操作時の振動フィードバックを有効にする',
		'preferences.experience.vibrate.note':
			'（端末とブラウザの対応が必要です）',
		'preferences.global.dataset.hideAria': '{label}のデータセットを非表示',
		'preferences.global.dataset.showAria': '{label}のデータセットを表示',
		'preferences.global.dataset.subTitle':
			'未所持のデータセットをオフにすると、そのデータセットにのみ登場・入手可能な内容を非表示にできます',
		'preferences.global.dataset.title': 'データセット',
		'preferences.global.famousShop': '「人気店」効果',
		'preferences.global.famousShop.disableAria':
			'「人気店」効果を無効にする',
		'preferences.global.famousShop.enableAria':
			'「人気店」効果を有効にする',
		'preferences.global.famousShop.rewardSuffix': ' 報酬スペルカード',
		'preferences.global.popularTrend.category': '種類：',
		'preferences.global.popularTrend.clear': '選択をクリア',
		'preferences.global.popularTrend.selectAria':
			'現在ゲーム内で流行しているタグを選択',
		'preferences.global.popularTrend.subTitle':
			'ゲーム内で現在の流行を正しく設定すると、セットメニューの評価がより正確になります',
		'preferences.global.popularTrend.switchAria': '{tag}に設定',
		'preferences.global.popularTrend.tag': 'タグ：',
		'preferences.global.popularTrend.title': '流行',
		'preferences.hidden.beverages': '特定のお酒を有効/無効にする',
		'preferences.hidden.dlcToggleHideAria': '{label}の全項目を非表示',
		'preferences.hidden.dlcToggleShowAria': '{label}の全項目を表示',
		'preferences.hidden.foodHiddenNote':
			'この料理は非表示の食材を含むため非表示になっています',
		'preferences.hidden.foods': '特定の料理を有効/無効にする',
		'preferences.hidden.groupHiddenNote':
			'このグループの料理はすべて、非表示の食材を含むため非表示になっています',
		'preferences.hidden.ingredients': '特定の食材を有効/無効にする',
		'preferences.hidden.itemHideAria': '{name}を非表示',
		'preferences.hidden.itemShowAria': '{name}を表示',
		'preferences.hidden.openSettings': '設定を開く',
		'preferences.language.section': '言語',
		'preferences.local.apply': 'この端末に適用',
		'preferences.local.cancel': 'キャンセル',
		'preferences.local.confirmApply': '適用を確認',
		'preferences.local.copyTip':
			'クリックして現在のお客様のセットメニューと営業プリセットデータをコピー',
		'preferences.local.export': 'エクスポート',
		'preferences.local.exporting': 'ダウンロードを試行中',
		'preferences.local.exportTip':
			'反応がない場合は、ブラウザの権限・設定・拡張機能を確認してください',
		'preferences.local.importPlaceholder':
			'ローカルファイルから、またはお客様のセットメニューと営業プリセットデータを入力',
		'preferences.local.selectFile': 'ローカルファイルを選択',
		'preferences.locale.system': 'システム言語（ブラウザに従う）',
		'preferences.palette.section': 'テーマカラー',
		'preferences.recommendation.card':
			'レア客ページのセットメニュー推薦カード',
		'preferences.recommendation.card.disableAria':
			'レア客ページのセットメニュー推薦カードを無効にする',
		'preferences.recommendation.card.enableAria':
			'レア客ページのセットメニュー推薦カードを有効にする',
		'preferences.recommendation.maxExtraIngredients': '追加食材の上限：',
		'preferences.recommendation.maxExtraIngredients.aria':
			'自動推薦セットメニューの追加食材の上限を選択',
		'preferences.recommendation.maxRating': '評価の上限：',
		'preferences.recommendation.maxRating.aria':
			'自動推薦セットメニューの最高評価を選択',
		'preferences.recommendation.maxResults': '最大推薦数：',
		'preferences.recommendation.maxResults.aria':
			'自動推薦するセットメニューの最大数を選択',
		'preferences.recommendation.note':
			'推薦パラメータはレア客ページのセットメニュー推薦カードと営業プリセットの自動推薦結果に影響します',
		'preferences.recommendation.sortProfile': 'デフォルト推薦方針：',
		'preferences.recommendation.sortProfile.aria':
			'自動推薦のデフォルト方針を選択',
		'preferences.recommendation.unlimited': '無制限',
		'preferences.reset.cancel': 'リセットをキャンセル',
		'preferences.reset.confirm': 'リセットを確認',
		'preferences.reset.meals':
			'保存済みのお客様セットメニューデータをリセット',
		'preferences.reset.plans': '保存済みの営業プリセットデータをリセット',
		'preferences.reset.tutorial':
			'レア客セットメニュー構成チュートリアルをやり直す',
		'preferences.section.appearance': '外観',
		'preferences.section.catalog': 'お客様ページ',
		'preferences.section.catalog.items': 'お酒・料理・食材',
		'preferences.section.catalog.specialGuest': 'レア客カード',
		'preferences.section.experience': '操作体験',
		'preferences.section.global': '全体設定',
		'preferences.section.recommendation': '「おすすめ」推薦',
		'preferences.subtitle': '以下の変更はすべて即時反映されます',
		'preferences.switch.off': 'オフ',
		'preferences.switch.on': 'オン',
		'preferences.theme.section': 'テーマ',
		'preferences.title': '設定',
	},
	ko: {
		'preferences.appearance.highAppearance':
			'부드러운 스크롤과 프로스트 글라스 효과',
		'preferences.appearance.highAppearance.disableAria':
			'부드러운 스크롤과 프로스트 글라스 효과 끄기',
		'preferences.appearance.highAppearance.enableAria':
			'부드러운 스크롤과 프로스트 글라스 효과 켜기',
		'preferences.appearance.highAppearance.notePerf':
			'(브라우저 성능 한계로 버벅거리면 끌 수 있습니다)',
		'preferences.appearance.highAppearance.noteReload':
			'(부드러운 스크롤 전환은 페이지를 새로고침해야 적용됩니다)',
		'preferences.appearance.tachie': '손님 페이지 오른쪽 아래의 일러스트',
		'preferences.appearance.tachie.hideAria': '손님 페이지 일러스트 숨기기',
		'preferences.appearance.tachie.note': '(와이드 화면에서 표시)',
		'preferences.appearance.tachie.showAria': '손님 페이지 일러스트 표시',
		'preferences.catalog.orderLinked.disabledAria':
			'주문 조건 태그 선택과 동시에 표를 필터링',
		'preferences.catalog.orderLinked.enabledAria':
			'주문 조건 태그 선택과 동시에 표를 필터링하지 않음',
		'preferences.catalog.orderLinked.label':
			'주문 조건 선택과 동시에 표 필터링',
		'preferences.catalog.tagDescription.hideAria': '요리 태그 설명 숨기기',
		'preferences.catalog.tagDescription.label':
			'요리 태그에 대응하는 키워드 표시',
		'preferences.catalog.tagDescription.showAria': '요리 태그 설명 표시',
		'preferences.cloud.autoGenerateNote':
			'(다음 백업 시 자동 생성됩니다. 직접 다른 곳에 보관하세요)',
		'preferences.cloud.closeParen': ')',
		'preferences.cloud.codeValidity':
			'백업 코드는 180일 동안 유효하며 사용할 때마다 자동 갱신되고, 기한이 지나면 자동으로 만료됩니다',
		'preferences.cloud.copyTip': '클릭하여 백업 코드 복사',
		'preferences.cloud.currentCode': '현재 백업 코드:',
		'preferences.cloud.delete': '클라우드 백업 삭제',
		'preferences.cloud.delete.fail': '삭제 실패',
		'preferences.cloud.delete.success': '삭제 완료',
		'preferences.cloud.deleting': '데이터 삭제 중',
		'preferences.cloud.download': '클라우드 백업 복원',
		'preferences.cloud.download.fail': '복원 실패',
		'preferences.cloud.download.success': '복원 완료',
		'preferences.cloud.downloadedAt': '다운로드 시각',
		'preferences.cloud.downloading': '데이터 가져오는 중',
		'preferences.cloud.format.parens': '({message})',
		'preferences.cloud.format.suffix': ' ({message})',
		'preferences.cloud.message.busy':
			'백업을 처리 중입니다. 잠시 후 다시 시도하세요',
		'preferences.cloud.message.codeInfoFailed':
			'백업 코드 정보를 가져오지 못했습니다',
		'preferences.cloud.message.codeNotFound':
			'클라우드에 이 백업 코드의 기록이 없습니다. 다른 곳에서 삭제되었을 수 있습니다',
		'preferences.cloud.message.invalidCode': '유효하지 않은 백업 코드',
		'preferences.cloud.message.targetNotFound': '대상 파일이 없습니다',
		'preferences.cloud.networkError': '(네트워크 오류)',
		'preferences.cloud.neverDownloaded': '아직 다운로드된 적 없음',
		'preferences.cloud.none': '없음',
		'preferences.cloud.promptCode': '기존 백업 코드를 입력하세요',
		'preferences.cloud.retry': '{minutes}분 후 다시 시도하세요',
		'preferences.cloud.separator': ', ',
		'preferences.cloud.updatedAt': '(업데이트 ',
		'preferences.cloud.upload': '클라우드에 백업',
		'preferences.cloud.upload.fail': '업로드 실패',
		'preferences.cloud.upload.success': '업로드 완료',
		'preferences.cloud.uploading': '데이터 업로드 중',
		'preferences.cloud.viewCode': '보기',
		'preferences.dataManager.subTitle':
			'손님 세트 메뉴와 영업 프리셋 데이터 백업/복원/초기화',
		'preferences.dataManager.tab.cloud': '클라우드 백업/복원',
		'preferences.dataManager.tab.legacy': '구 백업 코드 가져오기',
		'preferences.dataManager.tab.local': '로컬 가져오기/내보내기',
		'preferences.dataManager.tab.reset': '초기화',
		'preferences.dataManager.tabsAria': '데이터 관리 탭',
		'preferences.dataManager.title': '데이터 관리',
		'preferences.experience.tagsTooltip': '손님 카드 태그 툴팁',
		'preferences.experience.tagsTooltip.hideAria': '태그 툴팁 숨기기',
		'preferences.experience.tagsTooltip.note': '(마우스 오버 시 표시)',
		'preferences.experience.tagsTooltip.showAria': '태그 툴팁 표시',
		'preferences.experience.vibrate': '일부 동작의 진동 피드백',
		'preferences.experience.vibrate.disableAria': '진동 피드백 끄기',
		'preferences.experience.vibrate.enableAria': '진동 피드백 켜기',
		'preferences.experience.vibrate.note': '(기기와 브라우저 지원 필요)',
		'preferences.global.dataset.hideAria': '{label} 데이터셋 숨기기',
		'preferences.global.dataset.showAria': '{label} 데이터셋 표시',
		'preferences.global.dataset.subTitle':
			'보유하지 않은 데이터셋을 끄면 해당 데이터셋에만 등장하거나 획득할 수 있는 콘텐츠를 숨깁니다',
		'preferences.global.dataset.title': '데이터셋',
		'preferences.global.famousShop': '"인기 가게" 효과',
		'preferences.global.famousShop.disableAria': '"인기 가게" 효과 끄기',
		'preferences.global.famousShop.enableAria': '"인기 가게" 효과 켜기',
		'preferences.global.famousShop.rewardSuffix': ' 보상 스펠카드',
		'preferences.global.popularTrend.category': '종류:',
		'preferences.global.popularTrend.clear': '선택 지우기',
		'preferences.global.popularTrend.selectAria':
			'현재 게임 내 인기 태그 선택',
		'preferences.global.popularTrend.subTitle':
			'게임 내 현재 인기 트렌드를 올바르게 설정하면 세트 메뉴 평가가 더 정확해집니다',
		'preferences.global.popularTrend.switchAria': '{tag}(으)로 설정',
		'preferences.global.popularTrend.tag': '태그:',
		'preferences.global.popularTrend.title': '인기 트렌드',
		'preferences.hidden.beverages': '특정 음료 활성화/비활성화',
		'preferences.hidden.dlcToggleHideAria': '{label}의 모든 항목 숨기기',
		'preferences.hidden.dlcToggleShowAria': '{label}의 모든 항목 표시',
		'preferences.hidden.foodHiddenNote':
			'이 요리는 숨겨진 재료를 포함하고 있어 숨겨졌습니다',
		'preferences.hidden.foods': '특정 요리 활성화/비활성화',
		'preferences.hidden.groupHiddenNote':
			'이 그룹의 모든 요리는 숨겨진 재료를 포함하고 있어 숨겨졌습니다',
		'preferences.hidden.ingredients': '특정 재료 활성화/비활성화',
		'preferences.hidden.itemHideAria': '{name} 숨기기',
		'preferences.hidden.itemShowAria': '{name} 표시',
		'preferences.hidden.openSettings': '설정 열기',
		'preferences.language.section': '언어',
		'preferences.local.apply': '이 기기에 적용',
		'preferences.local.cancel': '취소',
		'preferences.local.confirmApply': '적용 확인',
		'preferences.local.copyTip':
			'클릭하여 현재 손님 세트 메뉴와 영업 프리셋 데이터 복사',
		'preferences.local.export': '내보내기',
		'preferences.local.exporting': '다운로드 시도 중',
		'preferences.local.exportTip':
			'반응이 없으면 브라우저 권한, 설정, 확장 프로그램을 확인하세요',
		'preferences.local.importPlaceholder':
			'로컬 파일에서 가져오거나 손님 세트 메뉴와 영업 프리셋 데이터를 입력',
		'preferences.local.selectFile': '로컬 파일 선택',
		'preferences.locale.system': '시스템 언어(브라우저 따름)',
		'preferences.palette.section': '테마 색상',
		'preferences.recommendation.card':
			'희귀 손님 페이지 세트 메뉴 추천 카드',
		'preferences.recommendation.card.disableAria':
			'희귀 손님 페이지 세트 메뉴 추천 카드 끄기',
		'preferences.recommendation.card.enableAria':
			'희귀 손님 페이지 세트 메뉴 추천 카드 켜기',
		'preferences.recommendation.maxExtraIngredients': '추가 재료 상한:',
		'preferences.recommendation.maxExtraIngredients.aria':
			'자동 추천 세트 메뉴의 추가 재료 상한 선택',
		'preferences.recommendation.maxRating': '평가 상한:',
		'preferences.recommendation.maxRating.aria':
			'자동 추천 세트 메뉴의 최고 평가 선택',
		'preferences.recommendation.maxResults': '최대 추천 수:',
		'preferences.recommendation.maxResults.aria':
			'자동 추천할 세트 메뉴 최대 개수 선택',
		'preferences.recommendation.note':
			'추천 파라미터는 희귀 손님 페이지의 세트 메뉴 추천 카드와 영업 프리셋의 자동 추천 결과에 영향을 줍니다',
		'preferences.recommendation.sortProfile': '기본 추천 방식:',
		'preferences.recommendation.sortProfile.aria':
			'자동 추천의 기본 방식을 선택',
		'preferences.recommendation.unlimited': '제한 없음',
		'preferences.reset.cancel': '초기화 취소',
		'preferences.reset.confirm': '초기화 확인',
		'preferences.reset.meals': '저장된 손님 세트 메뉴 데이터 초기화',
		'preferences.reset.plans': '저장된 영업 프리셋 데이터 초기화',
		'preferences.reset.tutorial':
			'레어 손님 세트 메뉴 구성 튜토리얼 다시 시작',
		'preferences.section.appearance': '외형',
		'preferences.section.catalog': '손님 페이지',
		'preferences.section.catalog.items': '음료·요리·재료',
		'preferences.section.catalog.specialGuest': '희귀 손님 카드',
		'preferences.section.experience': '사용 경험',
		'preferences.section.global': '전체 설정',
		'preferences.section.recommendation': '"원하실 것 같아요" 추천',
		'preferences.subtitle': '아래 모든 변경 사항은 즉시 적용됩니다',
		'preferences.switch.off': '끄기',
		'preferences.switch.on': '켜기',
		'preferences.theme.section': '테마',
		'preferences.title': '설정',
	},
	'zh-CN': PREFERENCES_MESSAGES_ZH_CN,
	'zh-TW': {
		'preferences.appearance.highAppearance': '平滑捲動和磨砂效果',
		'preferences.appearance.highAppearance.disableAria':
			'關閉平滑捲動和磨砂效果',
		'preferences.appearance.highAppearance.enableAria':
			'開啟平滑捲動和磨砂效果',
		'preferences.appearance.highAppearance.notePerf':
			'（如因瀏覽器效能受限而感卡頓可關閉）',
		'preferences.appearance.highAppearance.noteReload':
			'（開啟或關閉平滑捲動需重新整理頁面生效）',
		'preferences.appearance.tachie': '顧客頁面右下角的立繪',
		'preferences.appearance.tachie.hideAria': '隱藏顧客頁面立繪',
		'preferences.appearance.tachie.note': '（寬螢幕可見）',
		'preferences.appearance.tachie.showAria': '顯示顧客頁面立繪',
		'preferences.catalog.orderLinked.disabledAria':
			'選擇點單需求標籤的同時篩選表格',
		'preferences.catalog.orderLinked.enabledAria':
			'選擇點單需求標籤的同時不篩選表格',
		'preferences.catalog.orderLinked.label': '選擇點單需求的同時篩選表格',
		'preferences.catalog.tagDescription.hideAria': '隱藏料理標籤描述',
		'preferences.catalog.tagDescription.label':
			'顯示料理標籤所對應的關鍵詞',
		'preferences.catalog.tagDescription.showAria': '顯示料理標籤描述',
		'preferences.cloud.autoGenerateNote':
			'（下次備份時將自動生成，請自行保存至他處）',
		'preferences.cloud.closeParen': '）',
		'preferences.cloud.codeValidity':
			'備份碼有效期為180天，每次使用後會自動續期，逾期將自動失效',
		'preferences.cloud.copyTip': '點擊以複製備份碼',
		'preferences.cloud.currentCode': '目前備份碼：',
		'preferences.cloud.delete': '刪除雲端備份',
		'preferences.cloud.delete.fail': '刪除失敗',
		'preferences.cloud.delete.success': '刪除成功',
		'preferences.cloud.deleting': '正在刪除資料',
		'preferences.cloud.download': '還原雲端備份',
		'preferences.cloud.download.fail': '還原失敗',
		'preferences.cloud.download.success': '還原成功',
		'preferences.cloud.downloadedAt': '下載於',
		'preferences.cloud.downloading': '正在取得資料',
		'preferences.cloud.format.parens': '（{message}）',
		'preferences.cloud.format.suffix': '（{message}）',
		'preferences.cloud.message.busy': '備份正在處理中，請稍後重試',
		'preferences.cloud.message.codeInfoFailed': '取得備份碼資訊失敗',
		'preferences.cloud.message.codeNotFound':
			'雲端未記錄此備份碼，可能已於他處刪除？',
		'preferences.cloud.message.invalidCode': '無效的備份碼',
		'preferences.cloud.message.targetNotFound': '目標檔案不存在',
		'preferences.cloud.networkError': '（網路錯誤）',
		'preferences.cloud.neverDownloaded': '尚未被下載過',
		'preferences.cloud.none': '無',
		'preferences.cloud.promptCode': '請輸入已有備份碼',
		'preferences.cloud.retry': '請{minutes}分鐘後再試',
		'preferences.cloud.separator': '，',
		'preferences.cloud.updatedAt': '（更新於',
		'preferences.cloud.upload': '備份至雲端',
		'preferences.cloud.upload.fail': '上傳失敗',
		'preferences.cloud.upload.success': '上傳成功',
		'preferences.cloud.uploading': '正在上傳資料',
		'preferences.cloud.viewCode': '點此查看',
		'preferences.dataManager.subTitle':
			'備份/還原/重設顧客套餐和營業預設資料',
		'preferences.dataManager.tab.cloud': '雲端備份/還原',
		'preferences.dataManager.tab.legacy': '舊備份碼匯入',
		'preferences.dataManager.tab.local': '本地匯入/匯出',
		'preferences.dataManager.tab.reset': '重設',
		'preferences.dataManager.tabsAria': '資料管理選項卡',
		'preferences.dataManager.title': '資料管理',
		'preferences.experience.tagsTooltip': '顧客卡片中標籤的浮動提示',
		'preferences.experience.tagsTooltip.hideAria': '隱藏標籤浮動提示',
		'preferences.experience.tagsTooltip.note': '（滑鼠懸停可見）',
		'preferences.experience.tagsTooltip.showAria': '顯示標籤浮動提示',
		'preferences.experience.vibrate': '部分操作的震動回饋',
		'preferences.experience.vibrate.disableAria': '關閉操作震動回饋',
		'preferences.experience.vibrate.enableAria': '開啟操作震動回饋',
		'preferences.experience.vibrate.note': '（需裝置和瀏覽器支援）',
		'preferences.global.dataset.hideAria': '隱藏{label}資料集',
		'preferences.global.dataset.showAria': '顯示{label}資料集',
		'preferences.global.dataset.subTitle':
			'關閉未擁有的資料集以隱藏僅在對應資料集中出現或可以取得的內容',
		'preferences.global.dataset.title': '資料集',
		'preferences.global.famousShop': '「明星店」效果',
		'preferences.global.famousShop.disableAria': '關閉「明星店」效果',
		'preferences.global.famousShop.enableAria': '開啟「明星店」效果',
		'preferences.global.famousShop.rewardSuffix': ' 獎勵符卡',
		'preferences.global.popularTrend.category': '類別：',
		'preferences.global.popularTrend.clear': '清除選擇',
		'preferences.global.popularTrend.selectAria':
			'選擇遊戲中現時流行的標籤',
		'preferences.global.popularTrend.subTitle':
			'正確設定遊戲中現時的流行趨勢可以使套餐評級更為準確',
		'preferences.global.popularTrend.switchAria': '設定為{tag}',
		'preferences.global.popularTrend.tag': '標籤：',
		'preferences.global.popularTrend.title': '流行趨勢',
		'preferences.hidden.beverages': '啟用或停用特定酒水',
		'preferences.hidden.dlcToggleHideAria': '隱藏{label}的全部項目',
		'preferences.hidden.dlcToggleShowAria': '顯示{label}的全部項目',
		'preferences.hidden.foodHiddenNote':
			'此料理因包含已被隱藏的食材而被隱藏',
		'preferences.hidden.foods': '啟用或停用特定料理',
		'preferences.hidden.groupHiddenNote':
			'此分組下的所有料理均因包含已被隱藏的食材而被隱藏',
		'preferences.hidden.ingredients': '啟用或停用特定食材',
		'preferences.hidden.itemHideAria': '隱藏{name}',
		'preferences.hidden.itemShowAria': '顯示{name}',
		'preferences.hidden.openSettings': '開啟設定',
		'preferences.language.section': '語言',
		'preferences.local.apply': '應用到本裝置',
		'preferences.local.cancel': '取消',
		'preferences.local.confirmApply': '確認應用',
		'preferences.local.copyTip': '點擊以複製目前的顧客套餐和營業預設資料',
		'preferences.local.export': '匯出',
		'preferences.local.exporting': '嘗試喚起下載器',
		'preferences.local.exportTip':
			'如無回應，請檢查瀏覽器權限、設定和瀏覽器擴充功能',
		'preferences.local.importPlaceholder':
			'從本地檔案匯入或輸入顧客套餐和營業預設資料',
		'preferences.local.selectFile': '選擇本地檔案',
		'preferences.locale.system': '系統語言（跟隨瀏覽器）',
		'preferences.palette.section': '主題配色',
		'preferences.recommendation.card': '稀客頁面套餐推薦卡片',
		'preferences.recommendation.card.disableAria':
			'關閉稀客頁面套餐推薦卡片',
		'preferences.recommendation.card.enableAria':
			'開啟稀客頁面套餐推薦卡片',
		'preferences.recommendation.maxExtraIngredients': '加料上限：',
		'preferences.recommendation.maxExtraIngredients.aria':
			'選擇自動推薦套餐的額外食材上限',
		'preferences.recommendation.maxRating': '評級上限：',
		'preferences.recommendation.maxRating.aria':
			'選擇自動推薦套餐的最高評級',
		'preferences.recommendation.maxResults': '最多推薦：',
		'preferences.recommendation.maxResults.aria':
			'選擇自動推薦的最多套餐數量',
		'preferences.recommendation.note':
			'推薦參數會影響稀客頁面套餐推薦卡片和營業預設的自動推薦結果',
		'preferences.recommendation.sortProfile': '預設推薦策略：',
		'preferences.recommendation.sortProfile.aria':
			'選擇自動推薦的預設推薦策略',
		'preferences.recommendation.unlimited': '不限',
		'preferences.reset.cancel': '取消重設',
		'preferences.reset.confirm': '確認重設',
		'preferences.reset.meals': '重設已保存的顧客套餐資料',
		'preferences.reset.plans': '重設已保存的營業預設資料',
		'preferences.reset.tutorial': '重新進入稀客套餐搭配教學',
		'preferences.section.appearance': '外觀',
		'preferences.section.catalog': '顧客頁面',
		'preferences.section.catalog.items': '酒水、料理和食材',
		'preferences.section.catalog.specialGuest': '稀客卡片',
		'preferences.section.experience': '體驗',
		'preferences.section.global': '全域設定',
		'preferences.section.recommendation': '「猜您想要」推薦',
		'preferences.subtitle': '以下所有的變更都會即時生效',
		'preferences.switch.off': '關',
		'preferences.switch.on': '開',
		'preferences.theme.section': '主題',
		'preferences.title': '設定',
	},
} as const satisfies TLocalizedMessageTable<TPreferencesMessageKey>;
