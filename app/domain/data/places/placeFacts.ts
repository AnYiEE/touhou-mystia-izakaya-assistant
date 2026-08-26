import type { TDlc } from '@/domain/data/shared/types';

import type {
	TMapDisplayLabel,
	TMapLabel,
	TPlaceDisplayLabel,
	TPlaceLabel,
} from './types';

interface IMapFact {
	dlc: TDlc;
	label: TMapDisplayLabel;
	unlockTier: number;
}

/* eslint-disable sort-keys -- MAP_FACTS insertion order defines canonical map and UI ordering. */
export const MAP_FACTS = {
	BeastForest: { dlc: 0, label: '妖怪兽道', unlockTier: 0 },
	HumanVillage: { dlc: 0, label: '人间之里', unlockTier: 1 },
	HakureiShrine: { dlc: 0, label: '博丽神社', unlockTier: 2 },
	ScarletMansion: { dlc: 0, label: '红魔馆', unlockTier: 3 },
	BambooForest: { dlc: 0, label: '迷途竹林', unlockTier: 4 },
	DLC1_MagicForest: { dlc: 1, label: '魔法森林', unlockTier: 1 },
	DLC1_YoukaiMountain: { dlc: 1, label: '妖怪之山', unlockTier: 1 },
	DLC2_FormerHell: { dlc: 2, label: '旧地狱', unlockTier: 2 },
	DLC2_EarthSpiritsPalace: { dlc: 2, label: '地灵殿', unlockTier: 2 },
	DLC3_MyourenTemple: { dlc: 3, label: '命莲寺', unlockTier: 3 },
	DLC3_DivineSpiritMausoleum: { dlc: 3, label: '神灵庙', unlockTier: 3 },
	DLC4_GardenOfTheSun: { dlc: 4, label: '太阳花田', unlockTier: 4 },
	DLC4_ShiningNeedleCastle: { dlc: 4, label: '辉针城', unlockTier: 4 },
	DLC5_LunarCapital: { dlc: 5, label: '月之都', unlockTier: 5 },
	DLC5_Makai: { dlc: 5, label: '魔界', unlockTier: 5 },
} as const satisfies Record<TMapLabel, IMapFact>;
/* eslint-enable sort-keys */

export const ALL_MAP_LABELS = Object.keys(MAP_FACTS) as TMapLabel[];

export const ALL_MAP_LABELS_SET = new Set<string>(ALL_MAP_LABELS);

/* eslint-disable sort-keys -- PLACE_LABEL_MAP insertion order defines canonical map and UI ordering. */
export const PLACE_LABEL_MAP = {
	BeastForest: MAP_FACTS.BeastForest.label,
	HumanVillage: MAP_FACTS.HumanVillage.label,
	HakureiShrine: MAP_FACTS.HakureiShrine.label,
	ScarletMansion: MAP_FACTS.ScarletMansion.label,
	BambooForest: MAP_FACTS.BambooForest.label,
	DLC1_MagicForest: MAP_FACTS.DLC1_MagicForest.label,
	DLC1_YoukaiMountain: MAP_FACTS.DLC1_YoukaiMountain.label,
	DLC2_FormerHell: MAP_FACTS.DLC2_FormerHell.label,
	DLC2_EarthSpiritsPalace: MAP_FACTS.DLC2_EarthSpiritsPalace.label,
	DLC3_MyourenTemple: MAP_FACTS.DLC3_MyourenTemple.label,
	DLC3_DivineSpiritMausoleum: MAP_FACTS.DLC3_DivineSpiritMausoleum.label,
	DLC4_GardenOfTheSun: MAP_FACTS.DLC4_GardenOfTheSun.label,
	DLC4_ShiningNeedleCastle: MAP_FACTS.DLC4_ShiningNeedleCastle.label,
	DLC5_LunarCapital: MAP_FACTS.DLC5_LunarCapital.label,
	DLC5_Makai: MAP_FACTS.DLC5_Makai.label,
	Hakugyokurou: '白玉楼',
} as const satisfies Record<TPlaceLabel, TPlaceDisplayLabel>;
/* eslint-enable sort-keys */
