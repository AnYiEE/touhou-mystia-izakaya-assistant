import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import { type TCollectionProductType } from '@/domain/data/places/collectionYieldFacts';

export const PRAYER_LABEL_MAP = { MoriyaShrine: '西侧守矢分社' } as const;

export type TPrayerLabel = keyof typeof PRAYER_LABEL_MAP;

interface ICollectionPrayerRewardFact {
	amount: number;
	probability: number;
	productId: number;
	productType: TCollectionProductType;
}

interface ICurrencyPrayerRewardFact {
	amount: number;
	probability: number;
	productId: TCurrencyItemId;
	productType: 'currency';
}

export type TPrayerRewardFact =
	ICollectionPrayerRewardFact | ICurrencyPrayerRewardFact;

export const PRAYER_REWARD_FACTS = {
	MoriyaShrine: [
		{ amount: 1, probability: 100, productId: 29, productType: 'currency' },
		{ amount: 4, probability: 20, productId: 18, productType: 2 },
	],
} as const satisfies Record<TPrayerLabel, ReadonlyArray<TPrayerRewardFact>>;
