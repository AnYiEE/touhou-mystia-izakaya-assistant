import type { IGeneralItem } from './schema';

/* eslint-disable sort-keys -- Keep identity, display, DLC, then category details as the record data-table column order. */
export const GENERAL_ITEM_RECORDS = [
	{
		id: 0,
		name: '万份特典感谢信',
		description:
			'由于您的大力支持！「东方夜雀食堂」在抢鲜体验发售五天售出一万份，在此献上微不足道的感谢…！我们会把游戏做的更好！',
		dlc: 0,
		effects: [],
		from: [{ schedulerLabel: '10ThousandSalesCelebration-Event' }],
	},
	{
		id: 1,
		name: '签名色纸',
		description:
			'写着“阿加莎克里斯Q”的签名色纸，似乎是以侦探小说出名的作家，有着诸多粉丝。也许能交给更需要它的粉丝换点别的东西？',
		dlc: 0,
		effects: [],
		from: [{ positiveSpellCard: 3 }],
	},
	{
		id: 2,
		name: '香霖堂打折券',
		description:
			'能在香霖堂购物时得到一些优惠的道具。很可惜，有效期只有一天。',
		dlc: 0,
		effects: ['香霖堂使用金钱结算时享受七折优惠'],
		from: [{ positiveSpellCard: 6 }],
	},
	{
		id: 30,
		name: '金色的青蛙硬币',
		description: '从守矢小神社中摇出的金色青蛙硬币。',
		dlc: 0,
		effects: [],
		from: [{ holdingCurrencyItem: { amount: 100, currencyItem: 29 } }],
	},
	{
		id: 48,
		name: '红美铃的签名照',
		description:
			'红美铃的信物，上面有本人的签名，从笔迹可以想象到她一笔一划地写字时的样子。',
		dlc: 0,
		effects: [],
		from: [{ taskReward: 'Main_4_ScarletMansion_014-Mission_002' }],
	},
	{
		id: 49,
		name: '土龙罐',
		description:
			'相传是龙神升天前在地上存酒用的酒坛子。至于是不是真的……算了，买都买了。',
		dlc: 0,
		effects: [],
		from: [],
	},
	{
		id: 52,
		name: '幸运四叶草',
		description:
			'因幡帝给予你的“幸运的四叶草”，似乎在第二天就会消失的样子。既然是“幸运的白兔”给你的，也许带着它采集物品时会有什么好事发生吧？',
		dlc: 0,
		effects: [
			'采集点的每种产物额外获得1～2份',
			'垂钓主产物数量翻倍',
			'经营模拟中提高食材出售数量',
		],
		from: [{ positiveSpellCard: 29 }],
	},
	{
		id: 53,
		name: '猫豆腐老师的异世界宣传漫画',
		description:
			'似乎是异世界的「我」的故事，虽然发生着和这边差不多的事情，但也有些非常刺激的情况呢！海报上的内容是…请购买「深夜雀食堂」漫画了解详情，去地下室的话，可以反复的看这张广告…广告谁要反复看啊喂！',
		dlc: 0,
		effects: [],
		from: [{ schedulerLabel: 'Main_1_BeastForest_006.5_Collab-Event' }],
	},
	{
		id: 2014,
		name: '黑谷山女的推荐函',
		description:
			'怪诞料理挑战赛的推荐函，编号06040807，推荐人一栏写着“黑谷山女”。',
		dlc: 2,
		effects: [],
		from: [{ schedulerLabel: 'DLC2_Kizuna_Yamame_LV4_Upgrade_Event' }],
	},
	{
		id: 2015,
		name: '水桥帕露西的推荐函',
		description:
			'怪诞料理挑战赛的推荐函，编号02140410，推荐人一栏写着“水桥帕露西”。',
		dlc: 2,
		effects: [],
		from: [{ schedulerLabel: 'DLC2_Kizuna_Parsee_LV4_Upgrade_Event' }],
	},
	{
		id: 2016,
		name: '星熊勇仪的推荐函',
		description:
			'怪诞料理挑战赛的推荐函，编号01080727，推荐人一栏写着“星熊勇仪”。',
		dlc: 2,
		effects: [],
		from: [{ schedulerLabel: 'DLC2_Kizuna_Yuugi_LV4_Upgrade_Event' }],
	},
	{
		id: 2017,
		name: '古明地觉的推荐函',
		description:
			'怪诞料理挑战赛的推荐函，编号03101010，推荐人一栏写着“古明地觉”。',
		dlc: 2,
		effects: [],
		from: [{ schedulerLabel: 'DLC2_Kizuna_Satori_LV4_Upgrade_Event' }],
	},
	{
		id: 2018,
		name: '火焰猫燐的推荐函',
		description:
			'怪诞料理挑战赛的推荐函，编号02220015，推荐人一栏写着“火焰猫燐”。',
		dlc: 2,
		effects: [],
		from: [{ schedulerLabel: 'DLC2_Kizuna_Orin_LV4_Upgrade_Event' }],
	},
	{
		id: 2019,
		name: '灵乌路空的推荐函',
		description:
			'怪诞料理挑战赛的推荐函，编号10260009，推荐人一栏写着“灵乌路空”。',
		dlc: 2,
		effects: [],
		from: [{ schedulerLabel: 'DLC2_Kizuna_Utsuho_LV4_Upgrade_Event' }],
	},
	{
		id: 5015,
		name: '特殊的噗噗呦果',
		description:
			'魅魔小姐的委托品！要选择合适的品尝者送出，一定要小心别弄丢了。',
		dlc: 5,
		effects: [],
		from: [{ schedulerLabel: 'DLC5_Main_Part8_GotoMakai_Event' }],
	},
] as const satisfies Array<IGeneralItem<number>>;
/* eslint-enable sort-keys */

export const GENERAL_ITEM_LIST = GENERAL_ITEM_RECORDS satisfies IGeneralItem[];
