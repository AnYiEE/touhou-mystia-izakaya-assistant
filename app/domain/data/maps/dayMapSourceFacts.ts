import type { TDecorationId } from '@/domain/data/decorations/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { type TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import { type TMerchantLabel } from '@/domain/data/places/merchantFacts';

import { memoize } from '@/shared/utilities/cache/memoize';

import type { TDayMapLabel } from './types';

export interface IDayMapCharacterLocation {
	characterId: string;
	map: TDayMapLabel;
}

/** @description Original-game residents who grant catalog decorations. */
export const DAY_MAP_DECORATION_LOCATIONS: Partial<
	Record<TDecorationId, IDayMapCharacterLocation>
> = { 5014: { characterId: 'special-5009', map: 'DLC5_Makai' } };

/** @description Primary locations for catalog links without loading character artwork data. */
export const DAY_MAP_SPECIAL_GUEST_LOCATIONS: Partial<
	Record<TSpecialGuestId, IDayMapCharacterLocation>
> = {
	0: { characterId: 'special-0', map: 'BeastForest' },
	1: { characterId: 'special-1', map: 'BeastForest' },
	2: { characterId: 'special-2', map: 'BeastForest' },
	3: { characterId: 'special-3', map: 'HumanVillage' },
	4: { characterId: 'special-4', map: 'HumanVillage' },
	5: { characterId: 'special-5', map: 'HumanVillage' },
	6: { characterId: 'special-6', map: 'HumanVillage' },
	7: { characterId: 'special-7', map: 'HakureiShrine' },
	8: { characterId: 'special-8', map: 'HakureiShrine' },
	9: { characterId: 'special-9', map: 'HakureiShrine' },
	10: { characterId: 'special-10', map: 'DLC1_MagicForest' },
	15: { characterId: 'special-15', map: 'ScarletMansion' },
	24: { characterId: 'special-24', map: 'BambooForest' },
	25: { characterId: 'special-25', map: 'BambooForest' },
	27: { characterId: 'special-27', map: 'ScarletMansion' },
	28: { characterId: 'special-28', map: 'ScarletMansion' },
	29: { characterId: 'special-29', map: 'BambooForest' },
	30: { characterId: 'special-30', map: 'BeastForest' },
	31: { characterId: 'special-31', map: 'BeastForest' },
	39: { characterId: 'special-39', map: 'Hakugyokurou' },
	40: { characterId: 'special-40', map: 'Hakugyokurou' },
	41: { characterId: 'special-41', map: 'BeastForest' },
	1000: { characterId: 'special-1000', map: 'DLC1_YoukaiMountain' },
	1001: { characterId: 'special-1001', map: 'DLC1_YoukaiMountain' },
	1002: { characterId: 'special-1002', map: 'DLC1_MagicForest' },
	1004: { characterId: 'special-1004', map: 'DLC1_MagicForest' },
	1005: { characterId: 'special-1005', map: 'DLC1_YoukaiMountain' },
	2000: { characterId: 'special-2000', map: 'DLC2_FormerHell' },
	2001: { characterId: 'special-2001', map: 'DLC2_FormerHell' },
	2002: { characterId: 'special-2002', map: 'DLC2_FormerHell' },
	2003: { characterId: 'special-2003', map: 'DLC2_EarthSpiritsPalace' },
	2004: { characterId: 'special-2004', map: 'DLC2_EarthSpiritsPalace' },
	2005: { characterId: 'special-2005', map: 'DLC2_EarthSpiritsPalace' },
	3000: { characterId: 'special-3000', map: 'DLC3_MyourenTemple' },
	3001: { characterId: 'special-3001', map: 'DLC3_MyourenTemple' },
	3002: { characterId: 'special-3002', map: 'DLC3_MyourenTemple' },
	3003: { characterId: 'special-3003', map: 'DLC3_DivineSpiritMausoleum' },
	3004: { characterId: 'special-3004', map: 'DLC3_DivineSpiritMausoleum' },
	3005: { characterId: 'special-3005', map: 'DLC3_DivineSpiritMausoleum' },
	4000: { characterId: 'special-4000', map: 'DLC4_GardenOfTheSun' },
	4001: { characterId: 'special-4001', map: 'DLC4_GardenOfTheSun' },
	4002: { characterId: 'special-4002', map: 'DLC4_GardenOfTheSun' },
	4003: { characterId: 'special-4003', map: 'DLC4_ShiningNeedleCastle' },
	4004: { characterId: 'special-4004', map: 'DLC4_ShiningNeedleCastle' },
	4005: { characterId: 'special-4005', map: 'BambooForest' },
	5000: { characterId: 'special-5000', map: 'DLC5_LunarCapital' },
	5001: { characterId: 'special-5001', map: 'DLC5_LunarCapital' },
	5002: { characterId: 'special-5002', map: 'DLC5_LunarCapital' },
	5003: { characterId: 'special-5003', map: 'DLC5_Makai' },
	5004: { characterId: 'special-5004', map: 'DLC5_Makai' },
	5005: { characterId: 'special-5005', map: 'DLC5_Makai' },
	9000: { characterId: 'special-9000', map: 'ScarletMansion' },
	9001: { characterId: 'special-9001', map: 'ScarletMansion' },
	9002: { characterId: 'special-9002', map: 'HakureiShrine' },
	9003: { characterId: 'special-9003', map: 'BambooForest' },
	9004: { characterId: 'special-9004', map: 'DLC5_Makai' },
	10000: { characterId: 'special-10000', map: 'DLC1_YoukaiMountain' },
	10001: { characterId: 'special-10001', map: 'DLC1_YoukaiMountain' },
	10002: { characterId: 'special-10002', map: 'HakureiShrine' },
	11000: { characterId: 'special-11000', map: 'HumanVillage' },
	11001: { characterId: 'special-11001', map: 'HumanVillage' },
};

/** @description Scheduler sender/receiver bindings, keyed by the catalog task labels. */
export const DAY_MAP_TASK_LOCATIONS: Partial<
	Record<TSchedulerLabel, IDayMapCharacterLocation>
> = {
	DLC4_Kizuna_ImaizumiKagerou_LV4_Upgrade_TalkWakasagihime_Event: {
		characterId: 'special-4007',
		map: 'ScarletMansion',
	},
	Main_4_ScarletMansion_Loop_Mission_A: {
		characterId: 'special-20',
		map: 'ScarletMansion',
	},
	Main_4_ScarletMansion_Loop_Mission_B: {
		characterId: 'special-20',
		map: 'ScarletMansion',
	},
	Main_4_ScarletMansion_Loop_Mission_C: {
		characterId: 'special-20',
		map: 'ScarletMansion',
	},
	Side_HumanVillage_Loop_Mission_A: {
		characterId: 'normal-44',
		map: 'HumanVillage',
	},
	Side_HumanVillage_Loop_Mission_B: {
		characterId: 'normal-44',
		map: 'HumanVillage',
	},
	Side_HumanVillage_Loop_Mission_C: {
		characterId: 'normal-44',
		map: 'HumanVillage',
	},
	Side_HumanVillage_Loop_Mission_D: {
		characterId: 'normal-44',
		map: 'HumanVillage',
	},
};

export const DAY_MAP_MERCHANT_SPECIAL_GUESTS: Partial<
	Record<TMerchantLabel, TSpecialGuestId>
> = {
	DLC5_Makai_Merchant_Ellen_MagicShop: 5003,
	MengChengGuo: 30,
	Rinnosuke: 6,
	SpecialGuestShop_Tewi: 29,
	ThreeFairies: 31,
};

/** @description Primary map of merchants whose location is known through their special-guest sprite. */
export const getDayMapMerchantMap = memoize((merchant: TMerchantLabel) => {
	const specialGuest = DAY_MAP_MERCHANT_SPECIAL_GUESTS[merchant];
	return specialGuest === undefined
		? undefined
		: DAY_MAP_SPECIAL_GUEST_LOCATIONS[specialGuest]?.map;
});
