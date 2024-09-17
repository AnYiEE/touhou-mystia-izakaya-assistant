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

type TOrnament =
	| '超级钓鱼竿'
	| '仇返人形'
	| '地藏人偶'
	| '钓鱼竿'
	| '杜门谢客'
	| '飞碟老虎机'
	| '富贵牡丹'
	| '河童重工电话机'
	| '觉之眼'
	| '门无杂宾'
	| '胖滚君'
	| '强运桃子'
	| '幸运的素兔？'
	| '招财猫';

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

export type TReward =
	| {
			type: '摆件';
			reward: TOrnament;
			/** @description If `{{number}}` is used as a prefix,it is considered that the level of the bond has been specified, with a default value of 5. */
			description: string | null;
	  }
	| {
			type: '采集';
			reward: TPlace;
			description: string | null;
	  }
	| {
			type: '厨具';
			/** @description To get `reward`, use the instance of cooker. */
			reward: null;
			/** @description To get `description`, use the instance of cooker. */
			description: null;
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
