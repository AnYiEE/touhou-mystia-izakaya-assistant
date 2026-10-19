import type { IDayMapExtraFact, TExtraDayMapLabel } from './types';

/**
 * @description Generated from the installed game's Addressables. Do not edit by hand.
 */
/* eslint-disable sort-keys -- Insertion order defines the display order. */
export const DAY_MAP_EXTRA_FACTS = {
	Home: { dlc: 0, kind: 'interior', parent: 'BeastForest', name: '夜雀小屋' },
	Basement: {
		dlc: 0,
		kind: 'interior',
		parent: 'BeastForest',
		name: '地下室',
	},
	Hakugyokurou: { dlc: 0, kind: 'place', parent: null, name: '白玉楼' },
	DLC4_ScarletMansionBasement: {
		dlc: 4,
		kind: 'interior',
		parent: 'ScarletMansion',
		name: '红魔馆地下室',
	},
	DLC3_HakureiFestival: {
		dlc: 3,
		kind: 'event',
		parent: 'HakureiShrine',
		name: '博丽大祭',
	},
	PartyStage: { dlc: 0, kind: 'event', parent: null, name: '舞台' },
} as const satisfies Record<TExtraDayMapLabel, IDayMapExtraFact>;
/* eslint-enable sort-keys */
