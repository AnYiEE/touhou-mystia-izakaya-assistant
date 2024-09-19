import type {ICustomerBase, TPlace, TRecipeTag} from '@/data/types';

type TClothing =
	| '冬季水手服'
	| '番长服'
	| '访问着和服'
	| '海盗服'
	| '海滩度假装'
	| '黑色套装'
	| '花的报恩'
	| '花魁浴衣'
	| '军乐队礼服'
	| '魔女服'
	| '睡衣'
	| '褪色的巫女服'
	| '仙女服'
	| '星尘披风套装'
	| '中华风校服';

type TPartner =
	| '本居小铃'
	| '赤蛮奇'
	| '哆来咪'
	| '高丽野阿吽'
	| '宫古芳香'
	| '魂魄妖梦'
	| '键山雏'
	| '拉尔瓦'
	| '铃仙'
	| '梦子'
	| '萨拉'
	| '十六夜咲夜'
	| '琪斯美'
	| '小野冢小町'
	| '云居一轮';

export type TRewardType = '摆件' | '采集' | '厨具' | '服装' | '伙伴' | '料理';

export type TReward =
	| {
			type: '采集';
			reward: TPlace;
			description: string | null;
	  }
	| {
			type: '服装';
			reward: TClothing;
			description: string | null;
	  }
	| {
			type: '伙伴';
			reward: TPartner;
			description: true | string | null;
	  };

interface ISpellCard {
	name: string;
	description: `${string}。`;
	/** @todo {type: string} */
}

interface ISpellCards {
	negative: ISpellCard[];
	positive: ISpellCard[];
}

export interface ICustomerRare extends ICustomerBase {
	bondRewards: TReward[];
	spellCards: Partial<ISpellCards>;
	positiveTagMapping: Partial<Record<TRecipeTag, string>>;
	price: `${number}-${number}`;
}

export type TCustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type TCustomerRareNames = TCustomerRares[number]['name'];
