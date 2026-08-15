/** Game-native CookerType IDs. This category is independent of Cooker record IDs. */
export const COOKER_TYPE_MAP = {
	0: 'Empty',
	1: 'Pot',
	2: 'Grill',
	3: 'Fryer',
	4: 'Steamer',
	5: 'CuttingBoard',
} as const;

/** Existing Simplified Chinese display labels for usable CookerType IDs. */
export const COOKER_TYPE_LABEL_MAP = {
	1: '煮锅',
	2: '烧烤架',
	3: '油锅',
	4: '蒸锅',
	5: '料理台',
} as const;

/** Game-native CookerSeries IDs. This category is independent of Cooker record IDs. */
export const COOKER_SERIES_MAP = {
	0: 'Base',
	1: 'Sparrow',
	2: 'Super',
	3: 'Extreme',
	4: 'Nuclear',
	5: 'Suspicious',
	6: 'Tsukimi',
	1000: 'StarMagicPot',
	2000: 'PureHellFryer',
	3000: 'SamadhiFire',
	4000: 'PeerlessWindGod',
	5000: 'ByakurenCuttingBoard',
	5001: 'Trinity',
} as const;

/** Existing Simplified Chinese display labels for CookerSeries IDs. */
export const COOKER_SERIES_LABEL_MAP = {
	0: '初始',
	1: '夜雀',
	2: '超',
	3: '极',
	4: '核能',
	5: '可疑',
	6: '月见',
	1000: 'DLC',
	2000: 'DLC',
	3000: 'DLC',
	4000: 'DLC',
	5000: 'DLC',
	5001: 'DLC',
} as const;
