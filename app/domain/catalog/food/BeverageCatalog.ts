import isNil from 'lodash/isNil.js';

import { TaggedRecordCatalog } from '@/domain/catalog/shared/TaggedRecordCatalog';
import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import type { TBeverageId, TBeverages } from '@/domain/data/beverages/types';
import type { TBeverageTagId } from '@/domain/data/tags/types';
import { extractMapsFromFoodFrom } from '@/domain/places/foodSources';

import type { TBeverage } from './types';

type TBeverageSuitabilityRowData = TBeverage & {
	matchedTags: TBeverageTagId[];
	suitability: number;
};

export class BeverageCatalog extends TaggedRecordCatalog<
	TBeverages,
	TBeverageTagId,
	TBeverage
> {
	private static _instance: BeverageCatalog | undefined;

	private constructor(data: TBeverages) {
		const dataWithMaps = data.map((item) => ({
			...item,
			maps: extractMapsFromFoodFrom(item.from),
		}));

		super(dataWithMaps as unknown as TBeverages, 'beverage');
	}

	public static getInstance() {
		if (BeverageCatalog._instance !== undefined) {
			return BeverageCatalog._instance;
		}

		const instance = new BeverageCatalog(BEVERAGE_LIST);

		BeverageCatalog._instance = instance;

		return instance;
	}

	public buildBeverageSuitabilityRows(
		guestBeverageTags?: ReadonlyArray<TBeverageTagId> | null
	): TBeverageSuitabilityRowData[] {
		if (isNil(guestBeverageTags)) {
			return this.data.map((beverage) => ({
				...beverage,
				matchedTags: [],
				suitability: 0,
			}));
		}

		return this.data.map((beverage) => {
			const { suitability, tags: matchedTags } =
				this.getGuestSuitabilityByTags(beverage.id, guestBeverageTags);

			return { ...beverage, matchedTags, suitability };
		});
	}

	private getGuestSuitabilityByTags(
		beverage: TBeverageId,
		guestTags: ReadonlyArray<TBeverageTagId>
	) {
		const { commonTags, count } = this.getCommonTags(
			this.getPropsById(beverage, 'tags'),
			guestTags
		);

		return { suitability: count, tags: commonTags };
	}
}
