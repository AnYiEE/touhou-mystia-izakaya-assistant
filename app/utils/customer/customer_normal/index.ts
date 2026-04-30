import { checkEasterEgg, evaluateMeal } from './evaluateMeal';
import { Customer } from '../base';
import {
	CUSTOMER_NORMAL_LIST,
	type TCustomerNormalName,
	type TCustomerNormals,
	type TPlace,
} from '@/data';

import { checkLengthEmpty } from '@/utilities';

export class CustomerNormal extends Customer<TCustomerNormals> {
	private static _instance: CustomerNormal | undefined;

	public static getInstance() {
		if (CustomerNormal._instance !== undefined) {
			return CustomerNormal._instance;
		}

		const instance = new CustomerNormal(CUSTOMER_NORMAL_LIST);

		CustomerNormal._instance = instance;

		return instance;
	}

	public checkEasterEgg(args: Parameters<typeof checkEasterEgg>[number]) {
		return checkEasterEgg(args);
	}

	public evaluateMeal(args: Parameters<typeof evaluateMeal>[number]) {
		return evaluateMeal(args);
	}

	/**
	 * @description Build stable profile display meta for normal customer cards without carrying UI state or customer-specific presentation overrides.
	 */
	public getDisplayMeta(name: TCustomerNormalName): {
		hasOtherPlaces: boolean;
		mainPlace: TPlace | null;
		placeContent: string;
	} {
		const { places } = this.getPropsByName(name);
		const [mainPlace = null, ...otherPlaces] = places;
		const hasOtherPlaces = !checkLengthEmpty(otherPlaces);

		return {
			hasOtherPlaces,
			mainPlace,
			placeContent: hasOtherPlaces
				? `其他出没地区：${otherPlaces.join('、')}`
				: '暂未收录其他出没地区',
		};
	}
}
