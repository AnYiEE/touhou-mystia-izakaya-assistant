import type { ICurrencyItem } from './schema';

/* eslint-disable sort-keys -- Keep identity, display, DLC, then source as the record data-table column order. */
export const CURRENCY_ITEM_RECORDS = [
	{
		id: 3,
		name: '奇怪的石头',
		description:
			'兽道散落的奇形怪状的石头，还有点重。香霖堂的主人似乎对其很有兴趣。',
		dlc: 0,
		from: [{ mapSideTask: { map: 'BeastForest' } }],
	},
	{
		id: 4,
		name: '古朴的铜钱',
		description:
			'人间之里散落的有些年代感的铜钱，似乎已经不再流通。香霖堂的主人似乎对其很有兴趣。',
		dlc: 0,
		from: [{ mapSideTask: { map: 'HumanVillage' } }],
	},
	{
		id: 5,
		name: '破损的符咒',
		description:
			'博丽神社散落的破损的符咒，拼拼凑凑似乎也能得到点信息。香霖堂的主人似乎对其很有兴趣。',
		dlc: 0,
		from: [{ mapSideTask: { map: 'HakureiShrine' } }],
	},
	{
		id: 6,
		name: '红色的宝石',
		description:
			'红魔馆散落的红色的宝石，在幻想乡宝石和石头也没什么区别。香霖堂的主人似乎对其很有兴趣。',
		dlc: 0,
		from: [{ mapSideTask: { map: 'ScarletMansion' } }],
	},
	{
		id: 7,
		name: '发光的竹子',
		description:
			'迷途竹林偶尔看到的发光的竹子，不知道里面有什么呢。香霖堂的主人似乎对其很有兴趣。',
		dlc: 0,
		from: [{ mapSideTask: { map: 'BambooForest' } }],
	},
	{
		id: 29,
		name: '银色的青蛙硬币',
		description:
			'从守矢小神社中摇出的银色青蛙硬币。也许集齐一定数量会有什么好事发生？（持有一百枚时将自动获得衣服【水手服】和物品【金色的青蛙硬币】）',
		dlc: 0,
		from: [
			{
				mapPrayer: {
					locationLabel: '西侧守矢分社',
					map: 'HakureiShrine',
				},
			},
			{
				buy: {
					merchant: { label: '蓬松松爱莲♡魔法店', map: 'DLC5_Makai' },
					price: { amount: 4, currencyItem: 5011 },
				},
			},
		],
	},
	{
		id: 5011,
		name: '蓬松松糖果',
		description:
			'蓬松松爱莲魔法店发行的糖果形货币，是爱莲分享给大家的甜蜜。可以在蓬松松爱莲魔法店里换购商品。',
		dlc: 5,
		from: [
			{ spellCardReward: { specialGuest: 5003 } },
			{
				buy: {
					merchant: { label: '蓬松松爱莲♡魔法店', map: 'DLC5_Makai' },
					price: { amount: 4, currencyItem: 29 },
				},
			},
		],
	},
] as const satisfies Array<ICurrencyItem<number>>;
/* eslint-enable sort-keys */

export const CURRENCY_ITEM_LIST =
	CURRENCY_ITEM_RECORDS satisfies ICurrencyItem[];
