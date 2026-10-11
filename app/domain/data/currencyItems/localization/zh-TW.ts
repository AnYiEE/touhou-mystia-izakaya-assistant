import type { ILocalizedItemText } from '@/domain/data/localization/types';

export const CURRENCY_ITEM_LOCALIZATION_ZH_TW = {
	3: {
		description:
			'獸道散落的奇形怪狀的石頭，還有點重。香霖堂的主人似乎對其很有興趣。',
		name: '奇怪的石頭',
	},
	4: {
		description:
			'人間之里散落的有些年代感的銅錢，似乎已經不再流通。香霖堂的主人似乎對其很有興趣。',
		name: '古樸的銅錢',
	},
	5: {
		description:
			'博麗神社散落的破損的符咒，拼拼湊湊似乎也能得到點信息。香霖堂的主人似乎對其很有興趣。',
		name: '破損的符咒',
	},
	6: {
		description:
			'紅魔館散落的紅色的寶石，在幻想鄉寶石和石頭也沒什麼區別。香霖堂的主人似乎對其很有興趣。',
		name: '紅色的寶石',
	},
	7: {
		description:
			'迷途竹林偶爾看到的發光的竹子，不知道裏面有什麼呢。香霖堂的主人似乎對其很有興趣。',
		name: '發光的竹子',
	},
	29: {
		description:
			'從守矢小神社中搖出的銀色青蛙硬幣。也許集齊一定數量會有什麼好事發生？',
		name: '銀色的青蛙硬幣',
	},
	5011: {
		description:
			'蓬松松愛蓮魔法店發行的糖果形貨幣，是愛蓮分享給大家的甜蜜。可以在蓬松松愛蓮魔法店裏換購商品。',
		name: '蓬松松糖果',
	},
} as const satisfies Readonly<Partial<Record<number, ILocalizedItemText>>>;
