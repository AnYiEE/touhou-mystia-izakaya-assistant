import type { ILocalizedItemText } from '@/domain/data/localization/types';

export const CURRENCY_ITEM_LOCALIZATION_JA = {
	3: {
		description:
			'獣道に落ちていた奇妙な形の石。少し重い。香霖堂の主人がとても興味を示しているらしい。',
		name: '変な石ころ',
	},
	4: {
		description:
			'人間の里に落ちていた古ぼけたコイン。おそらくもう流通していない。香霖堂の主人がとても興味を示しているらしい。',
		name: '古い銅銭',
	},
	5: {
		description:
			'博麗神社に落ちていたボロボロのおふだ。断片を組み合わせると辛うじて何か読めそうだ。香霖堂の主人がとても興味を示しているらしい。',
		name: '破れた呪符',
	},
	6: {
		description:
			'紅魔館に落ちていたルビー。とはいえ幻想郷では宝石も石ころも大した価値の差はない。香霖堂の主人がとても興味を示しているらしい。',
		name: '紅色の宝石',
	},
	7: {
		description:
			'迷いの竹林でたまに見かける輝く竹。中に何が入っているのか気になるところ。香霖堂の主人がとても興味を示しているらしい。',
		name: '発光する竹',
	},
	29: {
		description:
			'守矢小神社から出てきた銀色のカエルコイン。集めると何かいいことがあるかも？',
		name: 'シルバーカエルコイン',
	},
	5011: {
		description:
			'「ふわふわエレン」魔法店が発行するキャンディ型通貨は、エレンがみんなにシェアする甘いもの。「ふわふわエレン」魔法店で商品を買い替えることができます。',
		name: 'ふわふわキャンディ',
	},
} as const satisfies Readonly<Partial<Record<number, ILocalizedItemText>>>;
