import type {ICustomerBase, TRecipeTag} from '@/data/types';

export type TRewardType = '摆件' | '采集' | '厨具' | '伙伴' | '料理' | '衣服';

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
	collection: boolean;
	spellCards: Partial<ISpellCards>;
	positiveTagMapping: Partial<Record<TRecipeTag, string>>;
	price: `${number}-${number}`;
}

export type TCustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type TCustomerRareNames = TCustomerRares[number]['name'];
