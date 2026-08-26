import type { TCollectableLabel } from './collectableLabels';

export type TCollectionProductType = 1 | 2;

export interface ICollectionPointYieldProduct {
	amount: number;
	kind: 'primary' | 'secondary';
	probability?: number;
	productId: number;
	productType: TCollectionProductType;
}

interface ICollectionPointYieldFact {
	label: TCollectableLabel;
	products: ReadonlyArray<ICollectionPointYieldProduct>;
}

export const COLLECTION_POINT_YIELD_FACTS = [
	{
		label: 'BeastForest_Trap',
		products: [
			{ amount: 2, kind: 'primary', productId: 4, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 15,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Trap2',
		products: [
			{ amount: 2, kind: 'primary', productId: 4, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 15,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_C3',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 15,
				productId: 24,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 85,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_Gendonka',
		products: [
			{ amount: 2, kind: 'primary', productId: 26, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 26,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_C4',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 15,
				productId: 24,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 85,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Bamboo',
		products: [
			{ amount: 5, kind: 'primary', productId: 12, productType: 2 },
			{
				amount: 5,
				kind: 'secondary',
				probability: 30,
				productId: 12,
				productType: 2,
			},
		],
	},
	{
		label: 'BeastForest_Plant_A2',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 27,
				productType: 1,
			},
			{
				amount: 3,
				kind: 'secondary',
				probability: 20,
				productId: 17,
				productType: 1,
			},
			{
				amount: 3,
				kind: 'secondary',
				probability: 10,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_A3',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 27,
				productType: 1,
			},
			{
				amount: 3,
				kind: 'secondary',
				probability: 20,
				productId: 17,
				productType: 1,
			},
			{
				amount: 3,
				kind: 'secondary',
				probability: 10,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_A',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 27,
				productType: 1,
			},
			{
				amount: 3,
				kind: 'secondary',
				probability: 20,
				productId: 17,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_OtterFestival',
		products: [
			{ amount: 1, kind: 'primary', productId: 10, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 10,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 10,
				productId: 10,
				productType: 2,
			},
		],
	},
	{
		label: 'BamBooForest_MoonLightHerb',
		products: [
			{ amount: 1, kind: 'primary', productId: 33, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 27,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Stream_C',
		products: [
			{ amount: 2, kind: 'primary', productId: 12, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 11,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Stream_A2',
		products: [
			{ amount: 4, kind: 'primary', productId: 10, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 10,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Stream_C2',
		products: [
			{ amount: 2, kind: 'primary', productId: 12, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 11,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Stream_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 11, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Stream_A3',
		products: [
			{ amount: 3, kind: 'primary', productId: 10, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 80,
				productId: 10,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Stream_B2',
		products: [
			{ amount: 2, kind: 'primary', productId: 11, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Stream_A',
		products: [
			{ amount: 3, kind: 'primary', productId: 10, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 10,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_B',
		products: [
			{ amount: 4, kind: 'primary', productId: 6, productType: 1 },
			{
				amount: 3,
				kind: 'secondary',
				probability: 50,
				productId: 6,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 9,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 10,
				productId: 35,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_C2',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 15,
				productId: 24,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 85,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_C',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 24,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 85,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'BeastForest_Plant_B2',
		products: [
			{ amount: 3, kind: 'primary', productId: 6, productType: 1 },
			{
				amount: 3,
				kind: 'secondary',
				probability: 50,
				productId: 6,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 9,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 10,
				productId: 35,
				productType: 1,
			},
		],
	},
	{
		label: 'HumanVillage_Chicken',
		products: [
			{ amount: 4, kind: 'primary', productId: 0, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 35,
				productId: 0,
				productType: 1,
			},
		],
	},
	{
		label: 'HumanVillage_Farmland_A',
		products: [
			{ amount: 20, kind: 'primary', productId: 7, productType: 1 },
		],
	},
	{
		label: 'HumanVillage_Farmland_B',
		products: [
			{ amount: 20, kind: 'primary', productId: 8, productType: 1 },
		],
	},
	{
		label: 'HumanVillage_Farmland_C',
		products: [
			{ amount: 20, kind: 'primary', productId: 9, productType: 1 },
		],
	},
	{
		label: 'HumanVillage_Stream_B',
		products: [
			{ amount: 5, kind: 'primary', productId: 10, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 10,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'HumanVillage_Stream_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 10, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 15,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'HumanVillage_Stream_C',
		products: [
			{ amount: 2, kind: 'primary', productId: 14, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 13,
				productType: 1,
			},
			{
				amount: 3,
				kind: 'secondary',
				probability: 40,
				productId: 11,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'HumanVillage_Tree',
		products: [
			{ amount: 2, kind: 'primary', productId: 22, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 22,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'HakureiShrine_TreeMushroom',
		products: [
			{ amount: 2, kind: 'primary', productId: 22, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 17,
				productType: 1,
			},
		],
	},
	{
		label: 'HakureiShrine_Potato',
		products: [
			{ amount: 2, kind: 'primary', productId: 6, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 6,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 9,
				productType: 1,
			},
		],
	},
	{
		label: 'HakureiShrine_Mushroom',
		products: [
			{ amount: 3, kind: 'primary', productId: 17, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 5,
				productId: 18,
				productType: 1,
			},
		],
	},
	{
		label: 'HakureiShrine_Tree_A',
		products: [
			{ amount: 3, kind: 'primary', productId: 21, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 21,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 40,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'HakureiShrine_Tree_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 25, productType: 1 },
			{
				amount: 5,
				kind: 'secondary',
				probability: 30,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'ScarletMansion_Ice',
		products: [
			{ amount: 4, kind: 'primary', productId: 34, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
		],
	},
	{
		label: 'ScarletMansion_Plant',
		products: [
			{ amount: 2, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'ScarletMansion_Grape',
		products: [
			{ amount: 10, kind: 'primary', productId: 36, productType: 1 },
		],
	},
	{
		label: 'ScarletMansion_Grape_B',
		products: [
			{ amount: 10, kind: 'primary', productId: 36, productType: 1 },
		],
	},
	{
		label: 'ScarletMansion_Tuna',
		products: [
			{ amount: 2, kind: 'primary', productId: 14, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 19,
				productType: 1,
			},
		],
	},
	{
		label: 'ScarletMansion_Shrimp',
		products: [
			{ amount: 2, kind: 'primary', productId: 23, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 20,
				productType: 1,
			},
		],
	},
	{
		label: 'BamBooForest_Mushroom_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 17,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 18,
				productType: 1,
			},
		],
	},
	{
		label: 'BamBooForest_Mushroom_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 17,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 18,
				productType: 1,
			},
		],
	},
	{
		label: 'BambooForest_Pond',
		products: [
			{ amount: 1, kind: 'primary', productId: 19, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 23,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 13,
				productType: 1,
			},
		],
	},
	{
		label: 'BambooForest_Rocket',
		products: [
			{ amount: 1, kind: 'primary', productId: 23, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 2,
			},
		],
	},
	{
		label: 'BamBooForest_BambooRoot',
		products: [
			{ amount: 1, kind: 'primary', productId: 28, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 31,
				productType: 1,
			},
		],
	},
	{
		label: 'BamBooForest_Bamboo',
		products: [
			{ amount: 3, kind: 'primary', productId: 31, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 28,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 28,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC1_MagicForest_Item_Dew_A',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Item_Dew_B',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Item_Dew_C',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Plant_Radish',
		products: [
			{ amount: 3, kind: 'primary', productId: 9, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Plant_Mushroom_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Plant_Mushroom_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Plant_Mushroom_C',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Plant_Peach',
		products: [
			{ amount: 3, kind: 'primary', productId: 21, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Tree',
		products: [
			{ amount: 2, kind: 'primary', productId: 22, productType: 1 },
		],
	},
	{
		label: 'DLC1_MagicForest_Item_GoblinRain',
		products: [
			{ amount: 2, kind: 'primary', productId: 1002, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 1002,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 1002,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 1002,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Trap',
		products: [
			{ amount: 2, kind: 'primary', productId: 4, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 1,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 15,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Item_Salt',
		products: [
			{ amount: 1, kind: 'primary', productId: 1003, productType: 1 },
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Plant_Potato',
		products: [
			{ amount: 3, kind: 'primary', productId: 6, productType: 1 },
			{
				amount: 3,
				kind: 'secondary',
				probability: 50,
				productId: 6,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 9,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 10,
				productId: 35,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Plant_Cucumber',
		products: [
			{ amount: 2, kind: 'primary', productId: 1000, productType: 1 },
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Water_Salmon',
		products: [
			{ amount: 3, kind: 'primary', productId: 13, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 15,
				productId: 19,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Water_Crab',
		products: [
			{ amount: 2, kind: 'primary', productId: 1005, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Tree',
		products: [
			{ amount: 2, kind: 'primary', productId: 22, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 22,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC1_YoukaiMountain_Water_Trout',
		products: [
			{ amount: 2, kind: 'primary', productId: 11, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 20,
				productId: 12,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_Item_BlackHairPork',
		products: [
			{ amount: 2, kind: 'primary', productId: 15, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 15,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 15,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_Item_WagyuBeef',
		products: [
			{ amount: 1, kind: 'primary', productId: 16, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 16,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 16,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_FreeOneself_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 25, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_FreeOneself_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 25, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_Water_Salmon',
		products: [
			{ amount: 2, kind: 'primary', productId: 13, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_Water_Lotus',
		products: [
			{ amount: 1, kind: 'primary', productId: 2000, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 2000,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 2000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_Item_Egg',
		products: [
			{ amount: 1, kind: 'primary', productId: 0, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 0,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 0,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_FormerHell_Tree_Lemon',
		products: [
			{ amount: 1, kind: 'primary', productId: 2001, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 2001,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 2001,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Item_Cheese_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 2002, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 2002,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Item_Cheese_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 2002, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 2002,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Beverage_A',
		products: [
			{ amount: 1, kind: 'primary', productId: 11, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 11,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Beverage_C',
		products: [
			{ amount: 2, kind: 'primary', productId: 22, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Beverage_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 16, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 17,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Plant_Ginkgo',
		products: [
			{ amount: 1, kind: 'primary', productId: 22, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Plant_Gendonka_B',
		products: [
			{ amount: 1, kind: 'primary', productId: 26, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 33,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Water_Puffer',
		products: [
			{ amount: 2, kind: 'primary', productId: 20, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 20,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 20,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Water_Salmon',
		products: [
			{ amount: 3, kind: 'primary', productId: 13, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 40,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 14,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Plant_Truffle',
		products: [
			{ amount: 2, kind: 'primary', productId: 18, productType: 1 },
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 18,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 18,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 17,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC2_EarthSpiritsPalace_Plant_Gendonka',
		products: [
			{ amount: 1, kind: 'primary', productId: 26, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 23,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 33,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 20,
				productId: 26,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_Plant_Honey_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_Plant_Honey_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_SweetPotato',
		products: [
			{ amount: 5, kind: 'primary', productId: 3001, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3001,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3001,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3001,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3001,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3001,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_Plant_Gendonka',
		products: [
			{ amount: 1, kind: 'primary', productId: 26, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 26,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 26,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_Water_LotusSeed_A',
		products: [
			{ amount: 1, kind: 'primary', productId: 3000, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_Water_Shrimp',
		products: [
			{ amount: 2, kind: 'primary', productId: 23, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_Water_LotusSeed_B',
		products: [
			{ amount: 1, kind: 'primary', productId: 3000, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_MyourenTemple_Water_Lotus',
		products: [
			{ amount: 1, kind: 'primary', productId: 2000, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 2000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Ice',
		products: [
			{ amount: 4, kind: 'primary', productId: 34, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 34,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Lotus',
		products: [
			{ amount: 1, kind: 'primary', productId: 2000, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 2000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Dew_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Dew_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Tunas_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 14, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Shrimp_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 23, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Shrimp_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 23, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Salmon_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 13, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Salmon_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 13, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Eel',
		products: [
			{ amount: 2, kind: 'primary', productId: 12, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_Tunas_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 14, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 14,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Water_LotusSeed',
		products: [
			{ amount: 1, kind: 'primary', productId: 3000, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Tree_Chestnut',
		products: [
			{ amount: 1, kind: 'primary', productId: 3003, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 3003,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 3003,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC3_DivineSpiritMausoleum_Tree_Pinecone',
		products: [
			{ amount: 1, kind: 'primary', productId: 3002, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 3002,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 3002,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Beverage_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 18, productType: 2 },
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Beverage_B',
		products: [
			{ amount: 3, kind: 'primary', productId: 16, productType: 2 },
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Beverage_OtterFestival',
		products: [
			{ amount: 1, kind: 'primary', productId: 10, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 10,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 10,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Tree_Honey_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Tree_Honey_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_Flower_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 4002, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_Flower_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 4002, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Tree_Dew',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_Mushroom',
		products: [
			{ amount: 3, kind: 'primary', productId: 17, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 17,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 17,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_Grape',
		products: [
			{ amount: 10, kind: 'primary', productId: 36, productType: 1 },
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Beverage_Bamboo',
		products: [
			{ amount: 5, kind: 'primary', productId: 12, productType: 2 },
			{
				amount: 5,
				kind: 'secondary',
				probability: 30,
				productId: 12,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Tree_Peach',
		products: [
			{ amount: 2, kind: 'primary', productId: 21, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 21,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 21,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_Radish',
		products: [
			{ amount: 10, kind: 'primary', productId: 9, productType: 1 },
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_ToonaSinensis',
		products: [
			{ amount: 3, kind: 'primary', productId: 4003, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4003,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4003,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Tree_Ginkgo',
		products: [
			{ amount: 3, kind: 'primary', productId: 22, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 22,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_MoonLightHerb',
		products: [
			{ amount: 1, kind: 'primary', productId: 33, productType: 1 },
		],
	},
	{
		label: 'DLC4_GardenOfTheSun_Plant_Tomato',
		products: [
			{ amount: 10, kind: 'primary', productId: 4004, productType: 1 },
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_Tree_RedBean',
		products: [
			{ amount: 5, kind: 'primary', productId: 4001, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 60,
				productId: 4001,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 60,
				productId: 4001,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 60,
				productId: 4001,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 4000,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 4000,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 4000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_RandomBeverage',
		products: [
			{ amount: 3, kind: 'primary', productId: 4000, productType: 2 },
			{
				amount: 3,
				kind: 'secondary',
				probability: 100,
				productId: 4001,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 10,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 11,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 16,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 17,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 18,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 20,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 21,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
		products: [
			{ amount: 3, kind: 'primary', productId: 1002, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 11,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 14,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 19,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 1001,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 1005,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_A',
		products: [
			{ amount: 3, kind: 'primary', productId: 12, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 10,
				productId: 19,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_B',
		products: [
			{ amount: 3, kind: 'primary', productId: 13, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 10,
				productId: 19,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_Plant_MoonLightHerb',
		products: [
			{ amount: 1, kind: 'primary', productId: 33, productType: 1 },
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_Plant_BambooShoot',
		products: [
			{ amount: 3, kind: 'primary', productId: 28, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 28,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 28,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC4_ShiningNeedleCastle_Plant_Bamboo',
		products: [
			{ amount: 4, kind: 'primary', productId: 31, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 28,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 30,
				productId: 28,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_LunarCapital_Tree_Peach',
		products: [
			{ amount: 2, kind: 'primary', productId: 21, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 21,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 21,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_LunarCapital_Water_Beverage',
		products: [
			{ amount: 3, kind: 'primary', productId: 4000, productType: 2 },
			{ amount: 3, kind: 'primary', productId: 4001, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 10,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 11,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 16,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 17,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 18,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 20,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 40,
				productId: 21,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC5_LunarCapital_Water_Lotus',
		products: [
			{ amount: 1, kind: 'primary', productId: 2000, productType: 1 },
			{ amount: 1, kind: 'primary', productId: 3000, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 2000,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 3000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_LunarCapital_Water_FicusPumila',
		products: [
			{ amount: 2, kind: 'primary', productId: 5003, productType: 1 },
			{ amount: 2, kind: 'primary', productId: 5004, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 5003,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 5003,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 5004,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 5004,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_LunarCapital_Water_FishAndMeat',
		products: [
			{ amount: 3, kind: 'primary', productId: 12, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 12,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 60,
				productId: 13,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 10,
				productId: 19,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Tree_CicadaSlough_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 25, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Tree_CicadaSlough_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 25, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 25,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Tree_CocoaBean',
		products: [
			{ amount: 8, kind: 'primary', productId: 5000, productType: 1 },
			{
				amount: 4,
				kind: 'secondary',
				probability: 40,
				productId: 5000,
				productType: 1,
			},
			{
				amount: 4,
				kind: 'secondary',
				probability: 40,
				productId: 5000,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Plant_Flower',
		products: [
			{ amount: 2, kind: 'primary', productId: 4002, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 4002,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Tree_Honey',
		products: [
			{ amount: 2, kind: 'primary', productId: 24, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 24,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Water_Fish',
		products: [
			{ amount: 3, kind: 'primary', productId: 12, productType: 1 },
			{
				amount: 2,
				kind: 'secondary',
				probability: 30,
				productId: 19,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 1005,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 1001,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 1002,
				productType: 1,
			},
			{
				amount: 2,
				kind: 'secondary',
				probability: 50,
				productId: 23,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Plant_Pepper',
		products: [
			{ amount: 3, kind: 'primary', productId: 35, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 35,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 35,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Item_Dew_A',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Item_Dew_B',
		products: [
			{ amount: 3, kind: 'primary', productId: 27, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 27,
				productType: 1,
			},
		],
	},
	{
		label: 'DLC5_Makai_Roof_Beverage',
		products: [
			{ amount: 1, kind: 'primary', productId: 5001, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 10,
				productId: 11,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 10,
				productId: 20,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 10,
				productId: 21,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 10,
				productId: 2000,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 10,
				productId: 5002,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC5_Makai_Plant_Mushroom_A',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC5_Makai_Plant_Mushroom_B',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC5_Makai_Plant_Mushroom_C',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC5_Makai_Plant_Mushroom_D',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC5_Makai_Plant_Mushroom_E',
		products: [
			{ amount: 2, kind: 'primary', productId: 17, productType: 1 },
		],
	},
	{
		label: 'DLC5_Makai_Item_GoblinRain',
		products: [
			{ amount: 2, kind: 'primary', productId: 1002, productType: 2 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 1002,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 1002,
				productType: 2,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 1002,
				productType: 2,
			},
		],
	},
	{
		label: 'DLC5_Makai_Plant_Broccoli',
		products: [
			{ amount: 2, kind: 'primary', productId: 5001, productType: 1 },
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 5001,
				productType: 1,
			},
			{
				amount: 1,
				kind: 'secondary',
				probability: 50,
				productId: 5001,
				productType: 1,
			},
		],
	},
] as const satisfies ReadonlyArray<ICollectionPointYieldFact>;

export function getCollectionPointYieldProducts(
	label: TCollectableLabel,
	productType: TCollectionProductType,
	productId: number
): ReadonlyArray<ICollectionPointYieldProduct> {
	const fact = COLLECTION_POINT_YIELD_FACTS.find(
		(candidate) => candidate.label === label
	);
	return (
		fact?.products.filter(
			(product) =>
				product.productType === productType &&
				product.productId === productId
		) ?? []
	);
}
