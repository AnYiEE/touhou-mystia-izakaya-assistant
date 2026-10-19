import { appShellMessages } from '@/features/appShell/client/messages';

import { type TLocalizedMessageTable } from '@/shared/i18n/messages';

const MAPS_MESSAGES_ZH_CN = {
	'maps.arrival': '到达点',
	'maps.back': '返回上一级地图',
	'maps.close': '关闭地图',
	'maps.detail.allDay': '全天',
	'maps.detail.arrival': '到达后位于{map}的入口处',
	'maps.detail.close': '关闭',
	'maps.detail.condition': '出现条件',
	'maps.detail.cookers': appShellMessages['zh-CN']['appShell.nav.cookers'],
	'maps.detail.costsAction': '消耗时间',
	'maps.detail.doubleClickTeleport':
		'双击地图上的“隙间传送”标记可直接打开世界地图。',
	'maps.detail.doubleClickTransition':
		'双击地图上的“通往{map}”标记可直接前往。',
	'maps.detail.fishing': '可在此区域钓鱼',
	'maps.detail.goods': '商品',
	'maps.detail.goTo': '前往{map}',
	'maps.detail.interaction.bed': '在家休息，可调整当前时间。',
	'maps.detail.interaction.beverageStorage': '查看并整理酒水库存。',
	'maps.detail.interaction.celebrationArtwork': '查看收藏的纪念贺图。',
	'maps.detail.interaction.cgGallery': '查看已解锁的CG。',
	'maps.detail.interaction.closet': '更换夜雀的服装。',
	'maps.detail.interaction.comicBook': '阅读收藏的漫画。',
	'maps.detail.interaction.cookingTable': '使用料理台查看食谱并制作料理。',
	'maps.detail.interaction.creatorBox':
		'开启或关闭对夜间经营的影响，编辑顾客到店时间轴，或查看说明书。',
	'maps.detail.interaction.donationBox':
		'可向赛钱箱投入赛钱，提升灵梦好感度，并参与紫的后续事件。',
	'maps.detail.interaction.donationBox100': '投入100日元：灵梦好感度+1。',
	'maps.detail.interaction.donationBox500':
		'投入500日元：灵梦好感度+1，并在当晚获得一次灵梦的奖励符卡。',
	'maps.detail.interaction.donationBox1000':
		'投入1000日元：灵梦好感度+2；当晚“{tag}”标签料理的烹饪时间缩短。',
	'maps.detail.interaction.donationBoxCumulative':
		'500日元和1000日元档位的效果按本次投入金额判定；累计金额用于最终事件。',
	'maps.detail.interaction.donationBoxFinal':
		'累计投入达到25500日元后触发紫的后续事件；本次投入获得灵梦好感度+17。',
	'maps.detail.interaction.fanart': '查看收藏的同人图。',
	'maps.detail.interaction.foodStorage': '查看并整理食材库存。',
	'maps.detail.interaction.jizoDoll':
		'一次性互动：随机获得2～4级食材或酒水。',
	'maps.detail.interaction.lunarConsole':
		'可激活宝具功能、复现战斗训练，并进入夜雀食堂生存模式。',
	'maps.detail.interaction.musicMachine':
		'游玩“幻想节拍”音游，选择已解锁地区和难度的曲目。',
	'maps.detail.interaction.musicPlayer': '选择经营时播放的唱片和曲目。',
	'maps.detail.interaction.repeatChallenge':
		'可重温博丽大祭，并参加音乐或料理挑战。',
	'maps.detail.interaction.showcase':
		'展示摆件；在地下室启用钓鱼竿后，各地会出现钓鱼点。',
	'maps.detail.interaction.slotMachine':
		'消耗资金抽一次奖，可获得食材或酒水奖励。',
	'maps.detail.interaction.telephone':
		'联系好友或商人，也可批量邀请、委托采集和扫货。',
	'maps.detail.interaction.tenThousandSales':
		'纪念作品销量达到一万份的收藏陈设。',
	'maps.detail.itemHint': '点击物品查看图鉴详情',
	'maps.detail.kind': '类别',
	'maps.detail.locate': '在地图中定位',
	'maps.detail.noMap': '该地点暂无地图',
	'maps.detail.offByDefault': '推进剧情或完成任务后出现',
	'maps.detail.openWorldMap': '打开世界地图',
	'maps.detail.otherPlaces': '其他出现地点',
	'maps.detail.passage': '通行',
	'maps.detail.probability': '（{probability}%）',
	'maps.detail.probabilityRolls': '（每次{probability}%，共{count}次）',
	'maps.detail.products': '产出',
	'maps.detail.randomSpots': '每天随机出现在以下{count}个位置之一',
	'maps.detail.recipes': '食谱',
	'maps.detail.refresh': '刷新周期',
	'maps.detail.refreshValue': '{hours}小时',
	'maps.detail.rewards': '祈愿奖励',
	'maps.detail.showTime': '出现时段',
	'maps.detail.spot': '位置{index}',
	'maps.detail.tagsBeverage':
		appShellMessages['zh-CN']['appShell.nav.beverages'],
	'maps.detail.tagsDislike': '厌恶',
	'maps.detail.tagsLike': '喜好',
	'maps.detail.task': '仅在对应任务进行时显示；任务结束后会从地图上消失。',
	'maps.detail.task.bottle': '按任务提示在妖怪兽道找到瓶子，并靠近调查。',
	'maps.detail.task.lantern': '按任务提示确认指定灯笼，并靠近调查。',
	'maps.detail.task.trace': '按任务提示调查地面上的书本、玉石或鸡毛线索。',
	'maps.detail.teleport':
		'可从这里传送到已解锁的地点，部分地点（如{first}、{second}）只能通过传送前往。',
	'maps.detail.timeRange': '{from}:00～{to}:00',
	'maps.detail.viewGuest': '查看稀客详情',
	'maps.detail.viewInCatalog': '在图鉴中查看',
	'maps.detail.viewPartner': '查看伙伴详情',
	'maps.facility.collaborationTerminal': '联动终端',
	'maps.kind.collectable': '采集点',
	'maps.kind.event': '活动场景',
	'maps.kind.facility': '设施',
	'maps.kind.fishing': '钓鱼点',
	'maps.kind.interaction': '特殊交互',
	'maps.kind.interior': '室内',
	'maps.kind.merchant': '商人',
	'maps.kind.partner': appShellMessages['zh-CN']['appShell.nav.partners'],
	'maps.kind.place': '地点',
	'maps.kind.prayer': '祈愿',
	'maps.kind.resident': '居民',
	'maps.kind.specialGuest':
		appShellMessages['zh-CN']['appShell.nav.specialGuests'],
	'maps.kind.task': '任务线索',
	'maps.kind.teleport': '隙间传送',
	'maps.kind.transition': '出入口',
	'maps.layers': '图层',
	'maps.link.guestPlaces': '地图位置：',
	'maps.link.viewOnMap': '在地图中查看',
	'maps.list.count': '{count}项',
	'maps.list.empty': '没有符合条件的条目',
	'maps.meta.description':
		'东方夜雀食堂世界地图：在游戏原版地图上查看采集点、钓鱼点、设施、商人、稀客、居民和任务线索，以及地图出入口和隙间传送。',
	'maps.search.placeholder': '搜索本地图条目',
	'maps.sidebar.collapse': '收起侧栏',
	'maps.sidebar.expand': '展开侧栏',
	'maps.title': '地图',
	'maps.toTarget': '通往{map}',
	'maps.world.enter': '进入{map}',
	'maps.world.hint': '选择地点查看地图',
	'maps.world.otherPlaces': '其他地点',
	'maps.world.regions': '地区',
	'maps.world.teleportOnly': '仅可传送前往',
	'maps.world.title': '世界地图',
	'maps.zoom.fit': '查看全图',
	'maps.zoom.in': '放大',
	'maps.zoom.out': '缩小',
} as const;

export type TMapsMessageKey = keyof typeof MAPS_MESSAGES_ZH_CN;

export const mapsMessages = {
	en: {
		'maps.arrival': 'Arrival',
		'maps.back': 'Back to previous map',
		'maps.close': 'Close map',
		'maps.detail.allDay': 'All day',
		'maps.detail.arrival': 'You will arrive at the entrance to {map}.',
		'maps.detail.close': 'Close',
		'maps.detail.condition': 'Condition',
		'maps.detail.cookers': appShellMessages.en['appShell.nav.cookers'],
		'maps.detail.costsAction': 'Consumes time',
		'maps.detail.doubleClickTeleport':
			'Double-click the “Gap teleport” marker on the map to open the world map.',
		'maps.detail.doubleClickTransition':
			'Double-click the “To {map}” marker on the map to travel there directly.',
		'maps.detail.fishing': 'You can fish in this area',
		'maps.detail.goods': 'Goods',
		'maps.detail.goTo': 'Go to {map}',
		'maps.detail.interaction.bed':
			'Rest at home and adjust the current time.',
		'maps.detail.interaction.beverageStorage':
			'View and organize beverage stock.',
		'maps.detail.interaction.celebrationArtwork':
			'View the collected celebration artwork.',
		'maps.detail.interaction.cgGallery': 'View unlocked CGs.',
		'maps.detail.interaction.closet': 'Change Mystia’s outfit.',
		'maps.detail.interaction.comicBook': 'Read collected comics.',
		'maps.detail.interaction.cookingTable':
			'Browse recipes and cook at the cooking table.',
		'maps.detail.interaction.creatorBox':
			'Toggle its effect on nighttime business, edit the guest arrival timeline, or read the manual.',
		'maps.detail.interaction.donationBox':
			'Donate at the offering box. Donations raise Reimu’s affinity and contribute to Yukari’s later event.',
		'maps.detail.interaction.donationBox100':
			'Donate ¥100: Reimu affinity +1.',
		'maps.detail.interaction.donationBox500':
			'Donate ¥500: Reimu affinity +1 and gain one of Reimu’s reward spell cards that night.',
		'maps.detail.interaction.donationBox1000':
			'Donate ¥1,000: Reimu affinity +2 and shorten the cooking time of dishes with the “{tag}” tag that night.',
		'maps.detail.interaction.donationBoxCumulative':
			'The ¥500 and ¥1,000 effects depend on the amount donated that time; the cumulative total is used for the final event.',
		'maps.detail.interaction.donationBoxFinal':
			'Reach ¥25,500 in cumulative donations to trigger Yukari’s follow-up event. This donation also grants Reimu +17 affinity.',
		'maps.detail.interaction.fanart': 'View the collected fan art.',
		'maps.detail.interaction.foodStorage':
			'View and organize ingredient stock.',
		'maps.detail.interaction.jizoDoll':
			'One-time interaction: receive a random level 2–4 ingredient or beverage.',
		'maps.detail.interaction.lunarConsole':
			'Activate treasure tools, replay battle training, or enter the Izakaya Survival Mode.',
		'maps.detail.interaction.musicMachine':
			'Play Gensou Beat and choose unlocked regional tracks and difficulties.',
		'maps.detail.interaction.musicPlayer':
			'Choose the record and track played while running the izakaya.',
		'maps.detail.interaction.repeatChallenge':
			'Replay the Hakurei Grand Festival and take on music or cooking challenges.',
		'maps.detail.interaction.showcase':
			'Display decorations. After enabling a fishing rod here, fishing spots appear across Gensokyo.',
		'maps.detail.interaction.slotMachine':
			'Spend money on one draw for ingredient or beverage rewards.',
		'maps.detail.interaction.telephone':
			'Contact friends or merchants, including bulk invitations, gathering requests, and shopping.',
		'maps.detail.interaction.tenThousandSales':
			'A commemorative display for reaching 10,000 copies sold.',
		'maps.detail.itemHint': 'Click an item to open its catalog card',
		'maps.detail.kind': 'Type',
		'maps.detail.locate': 'Show on map',
		'maps.detail.noMap': 'This location has no map',
		'maps.detail.offByDefault':
			'Appears after progressing the story or completing a task',
		'maps.detail.openWorldMap': 'Open world map',
		'maps.detail.otherPlaces': 'Also appears in',
		'maps.detail.passage': 'Passage',
		'maps.detail.probability': '({probability}%)',
		'maps.detail.probabilityRolls': '({probability}% each, {count} rolls)',
		'maps.detail.products': 'Yields',
		'maps.detail.randomSpots':
			'Appears at one of these {count} spots, chosen at random each day',
		'maps.detail.recipes': 'Recipes',
		'maps.detail.refresh': 'Refresh',
		'maps.detail.refreshValue': 'every {hours} hours',
		'maps.detail.rewards': 'Prayer rewards',
		'maps.detail.showTime': 'Hours',
		'maps.detail.spot': 'Spot {index}',
		'maps.detail.tagsBeverage':
			appShellMessages.en['appShell.nav.beverages'],
		'maps.detail.tagsDislike': 'Dislikes',
		'maps.detail.tagsLike': 'Likes',
		'maps.detail.task':
			'Visible only while the related task is active; it disappears from the map after the task ends.',
		'maps.detail.task.bottle':
			'Find the bottle on Youkai Trail as instructed, then interact with it up close.',
		'maps.detail.task.lantern':
			'Check the indicated lantern as instructed, then interact with it up close.',
		'maps.detail.task.trace':
			'Inspect the marked book, jade, or feather clue on the ground as instructed.',
		'maps.detail.teleport':
			'The gap here can take you to unlocked locations. Some places, such as {first} and {second}, can only be reached this way.',
		'maps.detail.timeRange': '{from}:00–{to}:00',
		'maps.detail.viewGuest': 'View special guest',
		'maps.detail.viewInCatalog': 'View in catalog',
		'maps.detail.viewPartner': 'View partner details',
		'maps.facility.collaborationTerminal': 'Collaboration terminal',
		'maps.kind.collectable': 'Gathering spot',
		'maps.kind.event': 'Event scene',
		'maps.kind.facility': 'Facility',
		'maps.kind.fishing': 'Fishing spot',
		'maps.kind.interaction': 'Special interaction',
		'maps.kind.interior': 'Interior',
		'maps.kind.merchant': 'Merchant',
		'maps.kind.partner': appShellMessages.en['appShell.nav.partners'],
		'maps.kind.place': 'Place',
		'maps.kind.prayer': 'Prayer',
		'maps.kind.resident': 'Resident',
		'maps.kind.specialGuest':
			appShellMessages.en['appShell.nav.specialGuests'],
		'maps.kind.task': 'Task clue',
		'maps.kind.teleport': 'Gap teleport',
		'maps.kind.transition': 'Exit',
		'maps.layers': 'Layers',
		'maps.link.guestPlaces': 'Map locations: ',
		'maps.link.viewOnMap': 'View on map',
		'maps.list.count': '{count}',
		'maps.list.empty': 'Nothing matches',
		'maps.meta.description':
			"Touhou Mystia's Izakaya world map: browse gathering and fishing spots, facilities, merchants, special guests, residents, and task clues on the original maps, along with exits and gap teleport.",
		'maps.search.placeholder': 'Search items on this map',
		'maps.sidebar.collapse': 'Collapse sidebar',
		'maps.sidebar.expand': 'Expand sidebar',
		'maps.title': 'Maps',
		'maps.toTarget': 'To {map}',
		'maps.world.enter': 'Enter {map}',
		'maps.world.hint': 'Choose a place to open its map',
		'maps.world.otherPlaces': 'Other places',
		'maps.world.regions': 'Areas',
		'maps.world.teleportOnly': 'Gap teleport only',
		'maps.world.title': 'World map',
		'maps.zoom.fit': 'Fit map',
		'maps.zoom.in': 'Zoom in',
		'maps.zoom.out': 'Zoom out',
	},
	ja: {
		'maps.arrival': '到着地点',
		'maps.back': '前のマップに戻る',
		'maps.close': '地図を閉じる',
		'maps.detail.allDay': '終日',
		'maps.detail.arrival': '移動後は{map}の入口に出ます',
		'maps.detail.close': '閉じる',
		'maps.detail.condition': '出現条件',
		'maps.detail.cookers': appShellMessages.ja['appShell.nav.cookers'],
		'maps.detail.costsAction': '時間を消費します',
		'maps.detail.doubleClickTeleport':
			'マップ上の「スキマ移動」マーカーをダブルクリックすると、ワールドマップを開けます。',
		'maps.detail.doubleClickTransition':
			'マップ上の「{map}へ」マーカーをダブルクリックすると、直接移動できます。',
		'maps.detail.fishing': 'このエリアで釣りができます',
		'maps.detail.goods': '商品',
		'maps.detail.goTo': '{map}へ移動',
		'maps.detail.interaction.bed': '家で休み、現在時刻を調整できます。',
		'maps.detail.interaction.beverageStorage':
			'酒水の在庫を確認・整理できます。',
		'maps.detail.interaction.celebrationArtwork':
			'所蔵している記念イラストを鑑賞できます。',
		'maps.detail.interaction.cgGallery': '解放済みのCGを鑑賞できます。',
		'maps.detail.interaction.closet': '夜雀の衣装を変更できます。',
		'maps.detail.interaction.comicBook': '所蔵している漫画を読めます。',
		'maps.detail.interaction.cookingTable':
			'料理台でレシピを確認し、料理できます。',
		'maps.detail.interaction.creatorBox':
			'夜間営業への効果のオン・オフ、来店タイムラインの編集、説明書の確認ができます。',
		'maps.detail.interaction.donationBox':
			'賽銭箱に賽銭を納められます。霊夢の好感度と紫の後続イベントに関係します。',
		'maps.detail.interaction.donationBox100':
			'100円を納める：霊夢の好感度+1。',
		'maps.detail.interaction.donationBox500':
			'500円を納める：霊夢の好感度+1、その夜に霊夢の奨励スペルカードを1枚獲得。',
		'maps.detail.interaction.donationBox1000':
			'1000円を納める：霊夢の好感度+2、その夜「{tag}」タグ料理の調理時間が短縮。',
		'maps.detail.interaction.donationBoxCumulative':
			'500円と1000円の効果は今回納めた金額で判定され、累計額は最終イベントに使われます。',
		'maps.detail.interaction.donationBoxFinal':
			'累計25500円に到達すると紫の後続イベントが発生します。今回の賽銭で得られる霊夢の好感度は+17。',
		'maps.detail.interaction.fanart':
			'所蔵しているファンアートを鑑賞できます。',
		'maps.detail.interaction.foodStorage':
			'食材の在庫を確認・整理できます。',
		'maps.detail.interaction.jizoDoll':
			'一度だけの交流：レベル2～4の食材または飲み物をランダムで獲得します。',
		'maps.detail.interaction.lunarConsole':
			'宝具機能の有効化、戦闘訓練の再現、夜雀食堂サバイバルモードへの参加ができます。',
		'maps.detail.interaction.musicMachine':
			'「ゲンソウビート」をプレイし、解放済みの地域曲と難易度を選択できます。',
		'maps.detail.interaction.musicPlayer':
			'営業中に再生するレコードと曲を選択できます。',
		'maps.detail.interaction.repeatChallenge':
			'博麗大祭を再体験し、音楽や料理の挑戦に参加できます。',
		'maps.detail.interaction.showcase':
			'装飾品を飾れます。ここで釣り竿を有効にすると、各地に釣り場が出現します。',
		'maps.detail.interaction.slotMachine':
			'お金を消費して一回抽選し、食材や酒水の報酬を獲得できます。',
		'maps.detail.interaction.telephone':
			'友達や商人に連絡でき、一括招待・採取依頼・買い出しも行えます。',
		'maps.detail.interaction.tenThousandSales':
			'売上1万本を記念したコレクション飾りです。',
		'maps.detail.itemHint':
			'アイテムをクリックすると図鑑の詳細を表示します',
		'maps.detail.kind': '種類',
		'maps.detail.locate': 'マップ上で表示',
		'maps.detail.noMap': 'この場所のマップはありません',
		'maps.detail.offByDefault':
			'ストーリーを進める、または任務を達成すると出現',
		'maps.detail.openWorldMap': 'ワールドマップを開く',
		'maps.detail.otherPlaces': 'ほかの出現場所',
		'maps.detail.passage': '通行',
		'maps.detail.probability': '（{probability}%）',
		'maps.detail.probabilityRolls': '（各{probability}%、{count}回）',
		'maps.detail.products': '産出',
		'maps.detail.randomSpots':
			'毎日、次の{count}か所のいずれかにランダムで出現',
		'maps.detail.recipes': 'レシピ',
		'maps.detail.refresh': '更新周期',
		'maps.detail.refreshValue': '{hours}時間',
		'maps.detail.rewards': '祈願報酬',
		'maps.detail.showTime': '出現時間帯',
		'maps.detail.spot': '位置{index}',
		'maps.detail.tagsBeverage':
			appShellMessages.ja['appShell.nav.beverages'],
		'maps.detail.tagsDislike': '嫌い',
		'maps.detail.tagsLike': '好み',
		'maps.detail.task':
			'対応する任務中だけ表示され、任務終了後は地図から消えます。',
		'maps.detail.task.bottle':
			'指示に従って妖怪の獣道の瓶を探し、近づいて調べます。',
		'maps.detail.task.lantern':
			'指示された提灯を確認し、近づいて調べます。',
		'maps.detail.task.trace':
			'指示に従って、地面にある本、玉、羽根の手がかりを調べます。',
		'maps.detail.teleport':
			'ここからスキマを使って解放済みの場所へ移動できます。{first}や{second}など、スキマ移動でしか行けない場所もあります。',
		'maps.detail.timeRange': '{from}:00～{to}:00',
		'maps.detail.viewGuest': 'レア客の詳細を見る',
		'maps.detail.viewInCatalog': '図鑑で見る',
		'maps.detail.viewPartner': `${appShellMessages.ja['appShell.nav.partners']}の詳細を見る`,
		'maps.facility.collaborationTerminal': 'コラボ端末',
		'maps.kind.collectable': '採取ポイント',
		'maps.kind.event': 'イベント会場',
		'maps.kind.facility': '施設',
		'maps.kind.fishing': '釣り場',
		'maps.kind.interaction': '特殊オブジェクト',
		'maps.kind.interior': '屋内',
		'maps.kind.merchant': '商人',
		'maps.kind.partner': appShellMessages.ja['appShell.nav.partners'],
		'maps.kind.place': '場所',
		'maps.kind.prayer': '祈願',
		'maps.kind.resident': '住人',
		'maps.kind.specialGuest':
			appShellMessages.ja['appShell.nav.specialGuests'],
		'maps.kind.task': '任務の手がかり',
		'maps.kind.teleport': 'スキマ移動',
		'maps.kind.transition': '出入口',
		'maps.layers': 'レイヤー',
		'maps.link.guestPlaces': 'マップ上の位置：',
		'maps.link.viewOnMap': 'マップで見る',
		'maps.list.count': '{count}件',
		'maps.list.empty': '条件に合う項目はありません',
		'maps.meta.description':
			'東方夜雀食堂のワールドマップ：原作マップ上で採取ポイント、釣り場、施設、商人、レア客、住人、任務の手がかりの位置と、出入口、スキマ移動を確認できます。',
		'maps.search.placeholder': 'このマップ内を検索',
		'maps.sidebar.collapse': 'サイドバーを折りたたむ',
		'maps.sidebar.expand': 'サイドバーを展開',
		'maps.title': 'マップ',
		'maps.toTarget': '{map}へ',
		'maps.world.enter': '{map}に入る',
		'maps.world.hint': '場所を選ぶとマップを表示します',
		'maps.world.otherPlaces': 'その他の場所',
		'maps.world.regions': '地域',
		'maps.world.teleportOnly': 'スキマ移動専用',
		'maps.world.title': 'ワールドマップ',
		'maps.zoom.fit': '全体を表示',
		'maps.zoom.in': '拡大',
		'maps.zoom.out': '縮小',
	},
	ko: {
		'maps.arrival': '도착 지점',
		'maps.back': '이전 지도로 돌아가기',
		'maps.close': '지도 닫기',
		'maps.detail.allDay': '종일',
		'maps.detail.arrival': '이동하면 {map} 입구에 도착합니다',
		'maps.detail.close': '닫기',
		'maps.detail.condition': '등장 조건',
		'maps.detail.cookers': appShellMessages.ko['appShell.nav.cookers'],
		'maps.detail.costsAction': '시간이 소모됩니다',
		'maps.detail.doubleClickTeleport':
			"지도에서 '스키마 이동' 마커를 두 번 클릭하면 월드맵을 열 수 있습니다.",
		'maps.detail.doubleClickTransition':
			"지도에서 '{map}(으)로' 마커를 두 번 클릭하면 바로 이동할 수 있습니다.",
		'maps.detail.fishing': '이 구역에서 낚시할 수 있습니다',
		'maps.detail.goods': '상품',
		'maps.detail.goTo': '{map}(으)로 이동',
		'maps.detail.interaction.bed':
			'집에서 휴식하며 현재 시간을 조정할 수 있습니다.',
		'maps.detail.interaction.beverageStorage':
			'주류 재고를 확인하고 정리할 수 있습니다.',
		'maps.detail.interaction.celebrationArtwork':
			'소장한 기념 일러스트를 감상할 수 있습니다.',
		'maps.detail.interaction.cgGallery': '해금한 CG를 감상할 수 있습니다.',
		'maps.detail.interaction.closet':
			'밤까마귀의 의상을 변경할 수 있습니다.',
		'maps.detail.interaction.comicBook': '소장한 만화를 읽을 수 있습니다.',
		'maps.detail.interaction.cookingTable':
			'조리대에서 레시피를 확인하고 요리할 수 있습니다.',
		'maps.detail.interaction.creatorBox':
			'야간 영업 효과를 켜거나 끄고, 손님 방문 타임라인을 편집하거나 설명서를 볼 수 있습니다.',
		'maps.detail.interaction.donationBox':
			'향전함에 향전을 넣을 수 있습니다. 레이무 호감도와 유카리의 후속 이벤트에 관련됩니다.',
		'maps.detail.interaction.donationBox100':
			'100엔 투입: 레이무 호감도 +1.',
		'maps.detail.interaction.donationBox500':
			'500엔 투입: 레이무 호감도 +1 및 그날 밤 레이무의 보상 스펠 카드 1장 획득.',
		'maps.detail.interaction.donationBox1000':
			'1000엔 투입: 레이무 호감도 +2 및 그날 밤 ‘{tag}’ 태그 요리의 조리 시간 단축.',
		'maps.detail.interaction.donationBoxCumulative':
			'500엔과 1000엔 효과는 이번에 투입한 금액으로 판정되며, 누적 금액은 최종 이벤트에 사용됩니다.',
		'maps.detail.interaction.donationBoxFinal':
			'누적 25,500엔에 도달하면 유카리의 후속 이벤트가 발생합니다. 이번 향전으로 얻는 레이무 호감도는 +17.',
		'maps.detail.interaction.fanart':
			'소장한 팬 아트를 감상할 수 있습니다.',
		'maps.detail.interaction.foodStorage':
			'식재료 재고를 확인하고 정리할 수 있습니다.',
		'maps.detail.interaction.jizoDoll':
			'일회성 상호작용: 2~4등급 식재료 또는 음료를 무작위로 획득합니다.',
		'maps.detail.interaction.lunarConsole':
			'보구 기능 활성화, 전투 훈련 재현, 밤참새 식당 서바이벌 모드 진입을 할 수 있습니다.',
		'maps.detail.interaction.musicMachine':
			'“환상 비트”를 플레이하고 해금한 지역 곡과 난이도를 선택할 수 있습니다.',
		'maps.detail.interaction.musicPlayer':
			'영업 중 재생할 레코드와 곡을 선택할 수 있습니다.',
		'maps.detail.interaction.repeatChallenge':
			'하쿠레이 예대제를 다시 체험하고 음악 또는 요리 도전에 참여할 수 있습니다.',
		'maps.detail.interaction.showcase':
			'장식품을 전시할 수 있습니다. 여기에서 낚싯대를 활성화하면 여러 지역에 낚시터가 나타납니다.',
		'maps.detail.interaction.slotMachine':
			'돈을 소모해 한 번 추첨하여 식재료나 주류 보상을 획득할 수 있습니다.',
		'maps.detail.interaction.telephone':
			'친구나 상인에게 연락할 수 있으며 일괄 초대, 채집 의뢰, 구매도 할 수 있습니다.',
		'maps.detail.interaction.tenThousandSales':
			'판매량 1만 부 달성을 기념하는 소장 장식입니다.',
		'maps.detail.itemHint': '아이템을 클릭하면 도감 상세를 볼 수 있습니다',
		'maps.detail.kind': '종류',
		'maps.detail.locate': '지도에서 위치 보기',
		'maps.detail.noMap': '이 장소의 지도는 없습니다',
		'maps.detail.offByDefault':
			'스토리를 진행하거나 임무를 완료하면 등장합니다.',
		'maps.detail.openWorldMap': '월드맵 열기',
		'maps.detail.otherPlaces': '다른 등장 장소',
		'maps.detail.passage': '통행',
		'maps.detail.probability': '({probability}%)',
		'maps.detail.probabilityRolls': '(각 {probability}%, {count}회)',
		'maps.detail.products': '산출',
		'maps.detail.randomSpots':
			'매일 다음 {count}곳 중 한 곳에 무작위로 등장합니다.',
		'maps.detail.recipes': '레시피',
		'maps.detail.refresh': '갱신 주기',
		'maps.detail.refreshValue': '{hours}시간',
		'maps.detail.rewards': '기원 보상',
		'maps.detail.showTime': '등장 시간대',
		'maps.detail.spot': '위치 {index}',
		'maps.detail.tagsBeverage':
			appShellMessages.ko['appShell.nav.beverages'],
		'maps.detail.tagsDislike': '비선호',
		'maps.detail.tagsLike': '선호',
		'maps.detail.task':
			'해당 임무가 진행 중일 때만 표시되며, 임무가 끝나면 지도에서 사라집니다.',
		'maps.detail.task.bottle':
			'안내에 따라 요괴 짐승길에서 병을 찾은 뒤 가까이에서 조사하세요.',
		'maps.detail.task.lantern':
			'안내된 등불을 확인한 뒤 가까이에서 조사하세요.',
		'maps.detail.task.trace':
			'안내에 따라 지면의 책, 옥, 깃털 단서를 조사하세요.',
		'maps.detail.teleport':
			'여기에서 스키마를 통해 해금한 장소로 이동할 수 있습니다. {first}, {second}처럼 스키마 이동으로만 갈 수 있는 장소도 있습니다.',
		'maps.detail.timeRange': '{from}:00~{to}:00',
		'maps.detail.viewGuest': '희귀 손님 상세 보기',
		'maps.detail.viewInCatalog': '도감에서 보기',
		'maps.detail.viewPartner': `${appShellMessages.ko['appShell.nav.partners']} 상세 보기`,
		'maps.facility.collaborationTerminal': '콜라보 단말',
		'maps.kind.collectable': '채집 지점',
		'maps.kind.event': '이벤트 장소',
		'maps.kind.facility': '시설',
		'maps.kind.fishing': '낚시터',
		'maps.kind.interaction': '특수 상호작용',
		'maps.kind.interior': '실내',
		'maps.kind.merchant': '상인',
		'maps.kind.partner': appShellMessages.ko['appShell.nav.partners'],
		'maps.kind.place': '장소',
		'maps.kind.prayer': '기원',
		'maps.kind.resident': '주민',
		'maps.kind.specialGuest':
			appShellMessages.ko['appShell.nav.specialGuests'],
		'maps.kind.task': '임무 단서',
		'maps.kind.teleport': '스키마 이동',
		'maps.kind.transition': '출입구',
		'maps.layers': '레이어',
		'maps.link.guestPlaces': '지도 위치: ',
		'maps.link.viewOnMap': '지도에서 보기',
		'maps.list.count': '{count}개',
		'maps.list.empty': '조건에 맞는 항목이 없습니다',
		'maps.meta.description':
			'동방 야작식당 월드맵: 원작 지도에서 채집 지점, 낚시터, 시설, 상인, 희귀 손님, 주민, 임무 단서의 위치와 출입구, 스키마 이동을 확인하세요.',
		'maps.search.placeholder': '이 지도에서 검색',
		'maps.sidebar.collapse': '사이드바 접기',
		'maps.sidebar.expand': '사이드바 펼치기',
		'maps.title': '지도',
		'maps.toTarget': '{map} 방면',
		'maps.world.enter': '{map} 지도 열기',
		'maps.world.hint': '장소를 선택하면 지도를 볼 수 있습니다',
		'maps.world.otherPlaces': '기타 장소',
		'maps.world.regions': '지역',
		'maps.world.teleportOnly': '스키마 이동 전용',
		'maps.world.title': '월드맵',
		'maps.zoom.fit': '전체 보기',
		'maps.zoom.in': '확대',
		'maps.zoom.out': '축소',
	},
	'zh-CN': MAPS_MESSAGES_ZH_CN,
	'zh-TW': {
		'maps.arrival': '到達點',
		'maps.back': '返回上一級地圖',
		'maps.close': '關閉地圖',
		'maps.detail.allDay': '全天',
		'maps.detail.arrival': '到達後位於{map}的入口處',
		'maps.detail.close': '關閉',
		'maps.detail.condition': '出現條件',
		'maps.detail.cookers':
			appShellMessages['zh-TW']['appShell.nav.cookers'],
		'maps.detail.costsAction': '消耗時間',
		'maps.detail.doubleClickTeleport':
			'雙擊地圖上的「隙間傳送」標記可直接開啟世界地圖。',
		'maps.detail.doubleClickTransition':
			'雙擊地圖上的「通往{map}」標記可直接前往。',
		'maps.detail.fishing': '可在此區域釣魚',
		'maps.detail.goods': '商品',
		'maps.detail.goTo': '前往{map}',
		'maps.detail.interaction.bed': '在家休息，可調整目前時間。',
		'maps.detail.interaction.beverageStorage': '查看並整理酒水庫存。',
		'maps.detail.interaction.celebrationArtwork': '查看收藏的紀念賀圖。',
		'maps.detail.interaction.cgGallery': '查看已解鎖的CG。',
		'maps.detail.interaction.closet': '更換夜雀的服裝。',
		'maps.detail.interaction.comicBook': '閱讀收藏的漫畫。',
		'maps.detail.interaction.cookingTable':
			'使用料理台查看食譜並製作料理。',
		'maps.detail.interaction.creatorBox':
			'開啟或關閉對夜間經營的影響，編輯顧客到店時間軸，或查看說明書。',
		'maps.detail.interaction.donationBox':
			'可向賽錢箱投入賽錢，提升靈夢好感度，並參與紫的後續事件。',
		'maps.detail.interaction.donationBox100': '投入100日圓：靈夢好感度+1。',
		'maps.detail.interaction.donationBox500':
			'投入500日圓：靈夢好感度+1，並在當晚獲得一次靈夢的獎勵符卡。',
		'maps.detail.interaction.donationBox1000':
			'投入1000日圓：靈夢好感度+2；當晚「{tag}」標籤料理的烹飪時間縮短。',
		'maps.detail.interaction.donationBoxCumulative':
			'500日圓和1000日圓檔位的效果按本次投入金額判定；累計金額用於最終事件。',
		'maps.detail.interaction.donationBoxFinal':
			'累計投入達到25500日圓後觸發紫的後續事件；本次投入獲得靈夢好感度+17。',
		'maps.detail.interaction.fanart': '查看收藏的同人圖。',
		'maps.detail.interaction.foodStorage': '查看並整理食材庫存。',
		'maps.detail.interaction.jizoDoll':
			'單次互動：隨機獲得2～4級食材或酒水。',
		'maps.detail.interaction.lunarConsole':
			'可啟用寶具功能、重現戰鬥訓練，並進入夜雀食堂生存模式。',
		'maps.detail.interaction.musicMachine':
			'遊玩「幻想節拍」音遊，選擇已解鎖地區和難度的曲目。',
		'maps.detail.interaction.musicPlayer': '選擇經營時播放的唱片和曲目。',
		'maps.detail.interaction.repeatChallenge':
			'可重溫博麗大祭，並參加音樂或料理挑戰。',
		'maps.detail.interaction.showcase':
			'展示擺件；在這裡啟用釣魚竿後，各地會出現釣魚點。',
		'maps.detail.interaction.slotMachine':
			'消耗資金抽一次獎，可獲得食材或酒水獎勵。',
		'maps.detail.interaction.telephone':
			'聯絡好友或商人，也可批次邀請、委託採集和掃貨。',
		'maps.detail.interaction.tenThousandSales':
			'紀念作品銷量達到一萬份的收藏陳設。',
		'maps.detail.itemHint': '點擊物品查看圖鑑詳情',
		'maps.detail.kind': '類別',
		'maps.detail.locate': '在地圖中定位',
		'maps.detail.noMap': '該地點暫無地圖',
		'maps.detail.offByDefault': '推進劇情或完成任務後出現',
		'maps.detail.openWorldMap': '開啟世界地圖',
		'maps.detail.otherPlaces': '其他出現地點',
		'maps.detail.passage': '通行',
		'maps.detail.probability': '（{probability}%）',
		'maps.detail.probabilityRolls': '（每次{probability}%，共{count}次）',
		'maps.detail.products': '產出',
		'maps.detail.randomSpots': '每天隨機出現在以下{count}個位置之一',
		'maps.detail.recipes': '食譜',
		'maps.detail.refresh': '刷新週期',
		'maps.detail.refreshValue': '{hours}小時',
		'maps.detail.rewards': '祈願獎勵',
		'maps.detail.showTime': '出現時段',
		'maps.detail.spot': '位置{index}',
		'maps.detail.tagsBeverage':
			appShellMessages['zh-TW']['appShell.nav.beverages'],
		'maps.detail.tagsDislike': '厭惡',
		'maps.detail.tagsLike': '喜好',
		'maps.detail.task':
			'僅在對應任務進行時顯示；任務結束後會從地圖上消失。',
		'maps.detail.task.bottle': '依任務提示在妖怪獸道找到瓶子，並靠近調查。',
		'maps.detail.task.lantern': '依任務提示確認指定燈籠，並靠近調查。',
		'maps.detail.task.trace':
			'依任務提示調查地面上的書本、玉石或雞毛線索。',
		'maps.detail.teleport':
			'可從這裡傳送到已解鎖的地點，部分地點（如{first}、{second}）只能透過傳送前往。',
		'maps.detail.timeRange': '{from}:00～{to}:00',
		'maps.detail.viewGuest': '查看稀客詳情',
		'maps.detail.viewInCatalog': '在圖鑑中查看',
		'maps.detail.viewPartner': '查看夥伴詳情',
		'maps.facility.collaborationTerminal': '關聯終端',
		'maps.kind.collectable': '採集點',
		'maps.kind.event': '活動場景',
		'maps.kind.facility': '設施',
		'maps.kind.fishing': '釣魚點',
		'maps.kind.interaction': '特殊互動',
		'maps.kind.interior': '室內',
		'maps.kind.merchant': '商人',
		'maps.kind.partner': appShellMessages['zh-TW']['appShell.nav.partners'],
		'maps.kind.place': '地點',
		'maps.kind.prayer': '祈願',
		'maps.kind.resident': '居民',
		'maps.kind.specialGuest':
			appShellMessages['zh-TW']['appShell.nav.specialGuests'],
		'maps.kind.task': '任務線索',
		'maps.kind.teleport': '隙間傳送',
		'maps.kind.transition': '出入口',
		'maps.layers': '圖層',
		'maps.link.guestPlaces': '地圖位置：',
		'maps.link.viewOnMap': '在地圖中查看',
		'maps.list.count': '{count}項',
		'maps.list.empty': '沒有符合條件的項目',
		'maps.meta.description':
			'東方夜雀食堂世界地圖：在遊戲原版地圖上查看採集點、釣魚點、設施、商人、稀客、居民和任務線索，以及地圖出入口和隙間傳送。',
		'maps.search.placeholder': '搜尋本地圖項目',
		'maps.sidebar.collapse': '收起側欄',
		'maps.sidebar.expand': '展開側欄',
		'maps.title': '地圖',
		'maps.toTarget': '通往{map}',
		'maps.world.enter': '進入{map}',
		'maps.world.hint': '選擇地點查看地圖',
		'maps.world.otherPlaces': '其他地點',
		'maps.world.regions': '地區',
		'maps.world.teleportOnly': '僅可傳送前往',
		'maps.world.title': '世界地圖',
		'maps.zoom.fit': '查看全圖',
		'maps.zoom.in': '放大',
		'maps.zoom.out': '縮小',
	},
} as const satisfies TLocalizedMessageTable<TMapsMessageKey>;
