import type { TCollectionProductType } from '@/domain/data/places/collectionYieldFacts';

export const PRAYER_LABEL_MAP = { MoriyaShrine: '西侧守矢分社' } as const;

export type TPrayerLabel = keyof typeof PRAYER_LABEL_MAP;

interface IPrayerRewardFact {
	amount: number;
	probability: number;
	productId: number;
	productType: TCollectionProductType;
}

export const PRAYER_REWARD_FACTS = {
	MoriyaShrine: [
		{ amount: 4, probability: 20, productId: 18, productType: 2 },
	],
} as const satisfies Record<TPrayerLabel, ReadonlyArray<IPrayerRewardFact>>;
