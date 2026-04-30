import {
	checkIngredientEasterEgg,
	checkRecipeEasterEgg,
	evaluateMeal,
} from './evaluateMeal';
import { Customer } from '../base';
import {
	CUSTOMER_RARE_LIST,
	type TCustomerRareName,
	type TCustomerRares,
	type TPlace,
} from '@/data';
import { Clothes } from '@/utils';

import { siteConfig } from '@/configs';
import { checkLengthEmpty } from '@/utilities';

const { cdnUrl } = siteConfig;

export class CustomerRare extends Customer<TCustomerRares> {
	private static _instance: CustomerRare | undefined;

	private static _tachiePathCache = new Map<TCustomerRareName, string>();

	public static getInstance() {
		if (CustomerRare._instance !== undefined) {
			return CustomerRare._instance;
		}

		const instance = new CustomerRare(CUSTOMER_RARE_LIST);

		CustomerRare._instance = instance;

		return instance;
	}

	public checkIngredientEasterEgg(
		args: Parameters<typeof checkIngredientEasterEgg>[number]
	) {
		return checkIngredientEasterEgg(args);
	}

	public checkRecipeEasterEgg(
		args: Parameters<typeof checkRecipeEasterEgg>[number]
	) {
		return checkRecipeEasterEgg(args);
	}

	public evaluateMeal(args: Parameters<typeof evaluateMeal>[number]) {
		return evaluateMeal(args);
	}

	/**
	 * @description Build stable profile display meta for rare customer cards without carrying UI state or tooltip structure.
	 */
	public getDisplayMeta(name: TCustomerRareName): {
		averagePrice: number;
		enduranceLimitPercent: number;
		hasEnduranceLimit: boolean;
		hasNegativeSpellCards: boolean;
		hasOtherPlaces: boolean;
		mainPlace: TPlace;
		placeContent: string;
	} {
		const { enduranceLimit, places, price, spellCards } =
			this.getPropsByName(name);
		const [mainPlace, ...otherPlaces] = places;
		const hasOtherPlaces = !checkLengthEmpty(otherPlaces);
		const averagePrice = (price[0] + price[1]) / 2;
		const enduranceLimitPercent = Math.floor(enduranceLimit * 100 - 100);
		const hasNegativeSpellCards =
			'negative' in spellCards &&
			!checkLengthEmpty<unknown>(spellCards.negative);

		return {
			averagePrice,
			enduranceLimitPercent,
			hasEnduranceLimit: enduranceLimitPercent > 0,
			hasNegativeSpellCards,
			hasOtherPlaces,
			mainPlace,
			placeContent: hasOtherPlaces
				? `其他出没地区：${otherPlaces.join('、')}`
				: '暂未收录其他出没地区',
		};
	}

	public getTachiePath(name: TCustomerRareName | null) {
		if (name === null) {
			return Clothes.getInstance().getTachiePath('夜雀服');
		}

		const basePath = `${cdnUrl}/assets/tachies/customer_rare`;

		let path: string;

		if (CustomerRare._tachiePathCache.has(name)) {
			path = CustomerRare._tachiePathCache.get(name);
		} else {
			path = `${basePath}/${this.formatId(this.getPropsByName(name, 'id'))}.png`;
			CustomerRare._tachiePathCache.set(name, path);
		}

		return path;
	}
}
