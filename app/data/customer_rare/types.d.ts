import type {ICustomerBase, TPlace, TRecipeTag} from '@/data/types';

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

type TReward =
	| {
			type: '采集';
			reward: TPlace;
			description: string | null;
	  }
	| {
			type: '伙伴';
			reward: TPartner;
			description: true | string | null;
	  };

export type TRewardType = '摆件' | '厨具' | '料理' | '衣服' | TReward['type'];

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
