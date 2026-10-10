import type { ILocalizedItemText } from '@/domain/data/localization/types';

export const CURRENCY_ITEM_LOCALIZATION_EN = {
	3: {
		description:
			'A bizarre rock found along the Youkai Trail. Quite heavy. The owner of Kourindou seems to be interested in it.',
		name: 'Bizarre Rock',
	},
	4: {
		description:
			'An old coin collected in the Human Village that is no longer in circulation. The owner of Kourindou seems to be interested in it.',
		name: 'Quaint Coin',
	},
	5: {
		description:
			'A torn talisman collected at Hakurei Shrine. You can make out some of the text by piecing them together. The owner of Kourindou seems to be interested in it.',
		name: 'Torn Talisman',
	},
	6: {
		description:
			'A red gem collected at the Scarlet Devil Mansion. It seems to have no difference when compared to other stones in Gensokyo. The owner of Kourindou seems to be interested in it.',
		name: 'Ruby',
	},
	7: {
		description:
			'Shining bamboo occasionally seen in the Bamboo Forest of the Lost. What could be inside? The owner of Kourindou seems to be interested in it.',
		name: 'Shining Bamboo',
	},
	29: {
		description:
			'A silver coin obtained from the Moriya branch shrine. Maybe something good will happen when you collect enough?',
		name: 'Silver Froggy Coin',
	},
	5011: {
		description:
			"Candy-shaped currency distributed by Fuwa Fuwa Ellen's Magic Shop. It's Ellen's way of sharing her sweetness with everyone. Can be traded for goods at Fuwa Fuwa Ellen's Magic Shop.",
		name: 'Fuwa Fuwa Candy',
	},
} as const satisfies Readonly<Partial<Record<number, ILocalizedItemText>>>;
