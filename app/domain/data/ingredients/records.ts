/* eslint-disable sort-keys */
import type { IIngredient } from './schema';

export const INGREDIENT_LIST = [
	{
		id: 0,
		name: '鸡蛋',
		description: '人里供应的鸡蛋，较为常见',
		type: -1,
		tags: [18],
		dlc: 0,
		level: 1,
		price: 4,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
				{ label: 'Merchant_Makai_Clown', map: 'DLC5_Makai' },
			],
			collect: [
				[
					{ label: 'HumanVillage_Chicken', map: 'HumanVillage' },
					false,
					10,
					17,
				],
				{ label: 'DLC2_FormerHell_Item_Egg', map: 'DLC2_FormerHell' },
			],
		},
	},
	{
		id: 1,
		name: '猪肉',
		description: '人里圈养的家猪肉，较为常见',
		type: 0,
		tags: [0],
		dlc: 0,
		level: 1,
		price: 10,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
			],
			collect: [
				[
					{
						label: 'DLC1_YoukaiMountain_Trap',
						map: 'DLC1_YoukaiMountain',
					},
					50,
				],
			],
		},
	},
	{
		id: 2,
		name: '牛肉',
		description: '人里圈养的肉牛肉，较为常见',
		type: 0,
		tags: [0],
		dlc: 0,
		level: 2,
		price: 15,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
				{ label: 'Merchant_FormerHell_Ghost', map: 'DLC2_FormerHell' },
			],
		},
	},
	{
		id: 3,
		name: '鹿肉',
		description: '猎人们在山间猎回来的鹿肉，有点珍贵',
		type: 0,
		tags: [0],
		dlc: 0,
		level: 2,
		price: 20,
		from: {
			buy: [
				{ label: 'Merchant_YokaiRabbitDelicacy', map: 'BambooForest' },
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				[
					{
						labels: ['BeastForest_Trap', 'BeastForest_Trap2'],
						map: 'BeastForest',
					},
					50,
				],
				[
					{
						label: 'DLC1_YoukaiMountain_Trap',
						map: 'DLC1_YoukaiMountain',
					},
					50,
				],
			],
		},
	},
	{
		id: 4,
		name: '野猪肉',
		description: '猎人们在山间猎回来的野猪肉，充满野性',
		type: 0,
		tags: [0],
		dlc: 0,
		level: 3,
		price: 25,
		from: {
			buy: [
				{ label: 'Merchant_Maid', map: 'HakureiShrine' },
				{
					label: 'Merchant_ShiningNeedleCastle_FuRyouShounenn',
					map: 'DLC4_ShiningNeedleCastle',
				},
			],
			collect: [
				{
					labels: ['BeastForest_Trap', 'BeastForest_Trap2'],
					map: 'BeastForest',
				},
				{
					label: 'DLC1_YoukaiMountain_Trap',
					map: 'DLC1_YoukaiMountain',
				},
			],
		},
	},
	{
		id: 5,
		name: '豆腐',
		description: '人里有卖的豆腐，较为常见',
		type: 2,
		tags: [2, 3, 7],
		dlc: 0,
		level: 1,
		price: 8,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{
					label: 'Merchant_EarthSpiritsPalace_HellCrow',
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
		},
	},
	{
		id: 6,
		name: '土豆',
		description: '随处可见的那种普通土豆',
		type: 2,
		tags: [2, 3],
		dlc: 0,
		level: 2,
		price: 10,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
			],
			collect: [
				{ label: 'BeastForest_Plant_B', map: 'BeastForest' },
				{ label: 'BeastForest_Plant_B2', map: 'BeastForest' },
				{ label: 'HakureiShrine_Potato', map: 'HakureiShrine' },
				{
					label: 'DLC1_YoukaiMountain_Plant_Potato',
					map: 'DLC1_YoukaiMountain',
				},
			],
		},
	},
	{
		id: 7,
		name: '洋葱',
		description: '人里农田产的洋葱，较为常见',
		type: 2,
		tags: [2, 16],
		dlc: 0,
		level: 2,
		price: 12,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
			],
			collect: [
				{
					labels: [
						'HumanVillage_Farmland_A',
						'HumanVillage_Farmland_B',
						'HumanVillage_Farmland_C',
					],
					map: 'HumanVillage',
				},
			],
			fishingAdvanced: ['HakureiShrine'],
		},
	},
	{
		id: 8,
		name: '南瓜',
		description: '人里农田产的南瓜，较为常见',
		type: 2,
		tags: [2, 9],
		dlc: 0,
		level: 2,
		price: 14,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
			],
			collect: [
				{
					labels: [
						'HumanVillage_Farmland_A',
						'HumanVillage_Farmland_B',
						'HumanVillage_Farmland_C',
					],
					map: 'HumanVillage',
				},
			],
		},
	},
	{
		id: 9,
		name: '萝卜',
		description: '人里农田产的萝卜，较为常见',
		type: 2,
		tags: [2, 8],
		dlc: 0,
		level: 2,
		price: 16,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
				{ label: 'Merchant_FormerHell_Ghost', map: 'DLC2_FormerHell' },
			],
			collect: [
				[{ label: 'BeastForest_Plant_B', map: 'BeastForest' }, 30],
				[{ label: 'BeastForest_Plant_B2', map: 'BeastForest' }, 30],
				{
					labels: [
						'HumanVillage_Farmland_A',
						'HumanVillage_Farmland_B',
						'HumanVillage_Farmland_C',
					],
					map: 'HumanVillage',
				},
				[{ label: 'HakureiShrine_Potato', map: 'HakureiShrine' }, 50],
				{
					label: 'DLC1_MagicForest_Plant_Radish',
					map: 'DLC1_MagicForest',
				},
				[
					{
						label: 'DLC1_YoukaiMountain_Plant_Potato',
						map: 'DLC1_YoukaiMountain',
					},
					30,
				],
				{
					label: 'DLC4_GardenOfTheSun_Plant_Radish',
					map: 'DLC4_GardenOfTheSun',
				},
			],
		},
	},
	{
		id: 10,
		name: '海苔',
		description: '不知道从哪里流入的外来食材，还挺常见',
		type: 2,
		tags: [2, 16],
		dlc: 0,
		level: 1,
		price: 3,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
			],
			collect: [
				[
					{ label: 'BeastForest_Stream_A2', map: 'BeastForest' },
					false,
					10,
					14,
				],
				[
					{ label: 'BeastForest_Stream_A', map: 'BeastForest' },
					false,
					10,
					14,
				],
				[
					{ label: 'BeastForest_Stream_A3', map: 'BeastForest' },
					false,
					10,
					14,
				],
				{ label: 'HumanVillage_Stream_A', map: 'HumanVillage' },
				[
					{ label: 'HumanVillage_Stream_B', map: 'HumanVillage' },
					false,
					16,
					18,
				],
				{ excludedMaps: ['BambooForest'] },
			],
			fishing: ['HumanVillage', 'HakureiShrine'],
			fishingAdvanced: ['BeastForest'],
		},
	},
	{
		id: 11,
		name: '鳟鱼',
		description: '栖息于淡水中的冷水鱼，较为常见',
		type: 1,
		tags: [1, 16],
		dlc: 0,
		level: 1,
		price: 8,
		from: {
			buy: [
				{ label: 'Merchant_FormerHell_Ghost', map: 'DLC2_FormerHell' },
			],
			collect: [
				[
					{ label: 'BeastForest_Stream_C', map: 'BeastForest' },
					30,
					14,
					18,
				],
				[
					{ label: 'BeastForest_Stream_B2', map: 'BeastForest' },
					false,
					14,
					18,
				],
				[
					{ label: 'BeastForest_Stream_C2', map: 'BeastForest' },
					30,
					14,
					18,
				],
				[
					{ label: 'BeastForest_Stream_B', map: 'BeastForest' },
					false,
					14,
					18,
				],
				[
					{ label: 'HumanVillage_Stream_C', map: 'HumanVillage' },
					40,
					10,
					15,
				],
				[
					{
						label: 'DLC1_YoukaiMountain_Water_Trout',
						map: 'DLC1_YoukaiMountain',
					},
					false,
					14,
					18,
				],
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
			],
			fishing: [
				'BeastForest',
				'HumanVillage',
				'ScarletMansion',
				'BambooForest',
				'DLC1_MagicForest',
				'DLC2_FormerHell',
				'DLC3_MyourenTemple',
				'DLC3_DivineSpiritMausoleum',
				'DLC4_GardenOfTheSun',
				'DLC4_ShiningNeedleCastle',
				'DLC5_Makai',
			],
		},
	},
	{
		id: 12,
		name: '八目鳗',
		description: '一种洄游性海鱼但却在幻想乡的河流湖泊随处可见，较为常见',
		type: 1,
		tags: [1, 16, 19],
		dlc: 0,
		level: 2,
		price: 14,
		from: {
			buy: [
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{
					label: 'Merchant_ShiningNeedleCastle_FuRyouShounenn',
					map: 'DLC4_ShiningNeedleCastle',
				},
			],
			collect: [
				[
					{ label: 'BeastForest_Stream_C', map: 'BeastForest' },
					false,
					14,
					18,
				],
				[
					{ label: 'BeastForest_Stream_A2', map: 'BeastForest' },
					20,
					10,
					14,
				],
				[
					{ label: 'BeastForest_Stream_A', map: 'BeastForest' },
					20,
					10,
					14,
				],
				[
					{ label: 'BeastForest_Stream_B2', map: 'BeastForest' },
					20,
					14,
					18,
				],
				[
					{ label: 'BeastForest_Stream_C2', map: 'BeastForest' },
					false,
					14,
					18,
				],
				[
					{ label: 'BeastForest_Stream_B', map: 'BeastForest' },
					20,
					14,
					18,
				],
				[
					{ label: 'BeastForest_Stream_A3', map: 'BeastForest' },
					20,
					10,
					14,
				],
				[
					{
						label: 'DLC1_YoukaiMountain_Water_Trout',
						map: 'DLC1_YoukaiMountain',
					},
					20,
					14,
					18,
				],
				{
					label: 'DLC3_DivineSpiritMausoleum_Water_Eel',
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_A',
					map: 'DLC4_ShiningNeedleCastle',
				},
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_B',
						map: 'DLC4_ShiningNeedleCastle',
					},
					50,
				],
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
				{
					label: 'DLC5_LunarCapital_Water_FishAndMeat',
					map: 'DLC5_LunarCapital',
				},
				{ label: 'DLC5_Makai_Water_Fish', map: 'DLC5_Makai' },
			],
			fishing: [
				'BeastForest',
				'HumanVillage',
				'DLC1_MagicForest',
				'DLC3_DivineSpiritMausoleum',
				'DLC4_ShiningNeedleCastle',
				'DLC5_LunarCapital',
			],
		},
	},
	{
		id: 13,
		name: '三文鱼',
		description: '一种高度洄游海鱼但在幻想乡的河流湖泊可见，有点珍贵',
		type: 1,
		tags: [1, 4, 16],
		dlc: 0,
		level: 3,
		price: 24,
		from: {
			buy: [
				[{ label: 'Merchant_BeastForest', map: 'BeastForest' }, 50],
				{ label: 'Merchant_FormerHell_Ghost', map: 'DLC2_FormerHell' },
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				[{ label: 'HumanVillage_Stream_A', map: 'HumanVillage' }, 30],
				[
					{ label: 'HumanVillage_Stream_B', map: 'HumanVillage' },
					30,
					16,
					18,
				],
				[
					{ label: 'HumanVillage_Stream_C', map: 'HumanVillage' },
					30,
					10,
					15,
				],
				[{ label: 'BambooForest_Pond', map: 'BambooForest' }, 30],
				{
					label: 'DLC1_YoukaiMountain_Water_Salmon',
					map: 'DLC1_YoukaiMountain',
				},
				{
					label: 'DLC2_FormerHell_Water_Salmon',
					map: 'DLC2_FormerHell',
				},
				{
					label: 'DLC2_EarthSpiritsPalace_Water_Salmon',
					map: 'DLC2_EarthSpiritsPalace',
				},
				{
					labels: [
						'DLC3_DivineSpiritMausoleum_Water_Salmon_A',
						'DLC3_DivineSpiritMausoleum_Water_Salmon_B',
						'DLC3_DivineSpiritMausoleum_Water_Shrimp_A',
						'DLC3_DivineSpiritMausoleum_Water_Shrimp_B',
					],
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					labels: [
						'DLC3_DivineSpiritMausoleum_Water_Salmon_A',
						'DLC3_DivineSpiritMausoleum_Water_Salmon_B',
					],
					map: 'DLC3_DivineSpiritMausoleum',
				},
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_A',
						map: 'DLC4_ShiningNeedleCastle',
					},
					50,
				],
				{
					label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_B',
					map: 'DLC4_ShiningNeedleCastle',
				},
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
				[
					{
						label: 'DLC5_LunarCapital_Water_FishAndMeat',
						map: 'DLC5_LunarCapital',
					},
					60,
				],
				[{ excludedMaps: ['BeastForest'] }, true],
			],
			fishing: [
				'BeastForest',
				'HumanVillage',
				'ScarletMansion',
				'BambooForest',
				'DLC2_FormerHell',
				'DLC2_EarthSpiritsPalace',
				'DLC3_MyourenTemple',
				'DLC3_DivineSpiritMausoleum',
				'DLC4_GardenOfTheSun',
				'DLC4_ShiningNeedleCastle',
				'DLC5_LunarCapital',
			],
		},
	},
	{
		id: 14,
		name: '金枪鱼',
		description: '一种大洋性洄游海鱼但在幻想乡的河流湖泊可见，有点珍贵',
		type: 1,
		tags: [1, 4, 16],
		dlc: 0,
		level: 3,
		price: 30,
		from: {
			buy: [
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				[
					{ label: 'HumanVillage_Stream_C', map: 'HumanVillage' },
					false,
					10,
					15,
				],
				{ label: 'ScarletMansion_Tuna', map: 'ScarletMansion' },
				[{ label: 'BambooForest_Pond', map: 'BambooForest' }, 30],
				[
					{
						label: 'DLC1_YoukaiMountain_Water_Salmon',
						map: 'DLC1_YoukaiMountain',
					},
					50,
				],
				[
					{
						label: 'DLC2_EarthSpiritsPalace_Water_Salmon',
						map: 'DLC2_EarthSpiritsPalace',
					},
					60,
				],
				{
					label: 'DLC3_DivineSpiritMausoleum_Water_Tunas_B',
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					label: 'DLC3_DivineSpiritMausoleum_Water_Tunas_A',
					map: 'DLC3_DivineSpiritMausoleum',
				},
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
				[{ excludedMaps: ['BeastForest'] }, true],
			],
			fishing: [
				'BambooForest',
				'DLC1_YoukaiMountain',
				'DLC2_FormerHell',
				'DLC2_EarthSpiritsPalace',
				'DLC3_MyourenTemple',
				'DLC4_GardenOfTheSun',
			],
		},
	},
	{
		id: 15,
		name: '黑毛猪肉',
		description: '在高海拔深山中圈养的黑毛猪肉，非常高级',
		type: 0,
		tags: [0, 5, 10],
		dlc: 0,
		level: 4,
		price: 35,
		from: {
			buy: [
				[{ label: 'Merchant_Maid', map: 'HakureiShrine' }, 80],
				{ label: 'Merchant_FormerHell_Ghost', map: 'DLC2_FormerHell' },
			],
			collect: [
				[
					{
						labels: ['BeastForest_Trap', 'BeastForest_Trap2'],
						map: 'BeastForest',
					},
					50,
				],
				[
					{
						label: 'DLC1_YoukaiMountain_Trap',
						map: 'DLC1_YoukaiMountain',
					},
					50,
				],
				{
					label: 'DLC2_FormerHell_Item_BlackHairPork',
					map: 'DLC2_FormerHell',
				},
			],
		},
	},
	{
		id: 16,
		name: '和牛',
		description: '传闻是超优质的肉牛品种，又称雪花肉，非常高级',
		type: 0,
		tags: [0, 4, 5],
		dlc: 0,
		level: 5,
		price: 40,
		from: {
			buy: [
				{ label: 'Merchant_Maid', map: 'HakureiShrine' },
				{ label: 'Merchant_Goblin', map: 'ScarletMansion' },
				{ label: 'Merchant_YokaiRabbitDelicacy', map: 'BambooForest' },
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				{
					label: 'DLC2_FormerHell_Item_WagyuBeef',
					map: 'DLC2_FormerHell',
				},
			],
			fishingAdvanced: ['DLC2_EarthSpiritsPalace', 'DLC5_LunarCapital'],
			task: [
				{
					task: [
						'Side_HumanVillage_Loop_Mission_A',
						'Side_HumanVillage_Loop_Mission_B',
						'Side_HumanVillage_Loop_Mission_C',
						'Side_HumanVillage_Loop_Mission_D',
					],
				},
			],
		},
	},
	{
		id: 17,
		name: '蘑菇',
		description: '从魔法之森采回来的品相良好的蘑菇，无法人工种植，非常珍贵',
		type: 2,
		tags: [2, 16, 26],
		dlc: 0,
		level: 3,
		price: 18,
		from: {
			buy: [
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				[
					{ label: 'BeastForest_Plant_A2', map: 'BeastForest' },
					20,
					10,
					11,
				],
				[
					{ label: 'BeastForest_Plant_A', map: 'BeastForest' },
					20,
					10,
					11,
				],
				[
					{ label: 'BeastForest_Plant_A3', map: 'BeastForest' },
					20,
					10,
					11,
				],
				[
					{
						label: 'HakureiShrine_TreeMushroom',
						map: 'HakureiShrine',
					},
					50,
				],
				{ label: 'HakureiShrine_Mushroom', map: 'HakureiShrine' },
				{ label: 'BamBooForest_Mushroom_A', map: 'BambooForest' },
				{ label: 'BamBooForest_Mushroom_B', map: 'BambooForest' },
				{
					labels: [
						'DLC1_MagicForest_Plant_Mushroom_A',
						'DLC1_MagicForest_Plant_Mushroom_B',
						'DLC1_MagicForest_Plant_Mushroom_C',
					],
					map: 'DLC1_MagicForest',
				},
				{
					label: 'DLC2_EarthSpiritsPalace_Plant_Truffle',
					map: 'DLC2_EarthSpiritsPalace',
				},
				{
					label: 'DLC4_GardenOfTheSun_Plant_Mushroom',
					map: 'DLC4_GardenOfTheSun',
				},
				{
					labels: [
						'DLC5_Makai_Plant_Mushroom_A',
						'DLC5_Makai_Plant_Mushroom_B',
						'DLC5_Makai_Plant_Mushroom_C',
						'DLC5_Makai_Plant_Mushroom_D',
						'DLC5_Makai_Plant_Mushroom_E',
					],
					map: 'DLC5_Makai',
				},
			],
			fishingAdvanced: ['DLC1_MagicForest'],
		},
	},
	{
		id: 18,
		name: '松露',
		description: '从魔法之森采回来的品相良好的松露，无法人工种植，非常珍贵',
		type: 2,
		tags: [2, 4, 5, 10, 16, 26],
		dlc: 0,
		level: 5,
		price: 50,
		from: {
			buy: [
				[{ label: 'Merchant_Maid', map: 'HakureiShrine' }, 80],
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					label: 'Merchant_ShiningNeedleCastle_FuRyouShounenn',
					map: 'DLC4_ShiningNeedleCastle',
				},
			],
			collect: [
				[{ label: 'HakureiShrine_Mushroom', map: 'HakureiShrine' }, 5],
				[{ label: 'BamBooForest_Mushroom_A', map: 'BambooForest' }, 30],
				[{ label: 'BamBooForest_Mushroom_B', map: 'BambooForest' }, 30],
				{
					label: 'DLC2_EarthSpiritsPalace_Plant_Truffle',
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
			fishingAdvanced: ['ScarletMansion', 'DLC1_MagicForest'],
			task: [
				{
					task: [
						'Side_HumanVillage_Loop_Mission_A',
						'Side_HumanVillage_Loop_Mission_B',
						'Side_HumanVillage_Loop_Mission_C',
						'Side_HumanVillage_Loop_Mission_D',
					],
				},
			],
		},
	},
	{
		id: 19,
		name: '极上金枪鱼',
		description: '金枪鱼中的顶级品种，非常珍贵',
		type: 1,
		tags: [1, 4, 5, 11, 16],
		dlc: 0,
		level: 5,
		price: 34,
		from: {
			buy: [
				[{ label: 'Merchant_Maid', map: 'HakureiShrine' }, 80],
				{ label: 'Merchant_Goblin', map: 'ScarletMansion' },
				{ label: 'Merchant_YokaiRabbitDelicacy', map: 'BambooForest' },
			],
			collect: [
				[{ label: 'ScarletMansion_Tuna', map: 'ScarletMansion' }, 40],
				{ label: 'BambooForest_Pond', map: 'BambooForest' },
				[
					{
						label: 'DLC1_YoukaiMountain_Water_Salmon',
						map: 'DLC1_YoukaiMountain',
					},
					15,
				],
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_A',
						map: 'DLC4_ShiningNeedleCastle',
					},
					10,
				],
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_B',
						map: 'DLC4_ShiningNeedleCastle',
					},
					10,
				],
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
				[
					{
						label: 'DLC5_LunarCapital_Water_FishAndMeat',
						map: 'DLC5_LunarCapital',
					},
					10,
				],
				[{ label: 'DLC5_Makai_Water_Fish', map: 'DLC5_Makai' }, 30],
			],
			fishing: [
				'ScarletMansion',
				'BambooForest',
				'DLC2_FormerHell',
				'DLC3_MyourenTemple',
				'DLC3_DivineSpiritMausoleum',
				'DLC4_GardenOfTheSun',
				'DLC5_LunarCapital',
				'DLC5_Makai',
			],
			task: [
				{
					task: [
						'Side_HumanVillage_Loop_Mission_A',
						'Side_HumanVillage_Loop_Mission_B',
						'Side_HumanVillage_Loop_Mission_C',
						'Side_HumanVillage_Loop_Mission_D',
					],
				},
			],
		},
	},
	{
		id: 20,
		name: '河豚',
		description: '高级水产品，但体内含毒素，需小心处理。',
		type: 1,
		tags: [1, 11, 16],
		dlc: 0,
		level: 5,
		price: 42,
		from: {
			buy: [
				[{ label: 'Merchant_Maid', map: 'HakureiShrine' }, 80],
				{ label: 'Merchant_Goblin', map: 'ScarletMansion' },
				{ label: 'Merchant_YokaiRabbitDelicacy', map: 'BambooForest' },
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				[{ label: 'ScarletMansion_Shrimp', map: 'ScarletMansion' }, 40],
				{
					label: 'DLC2_EarthSpiritsPalace_Water_Puffer',
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
			fishing: [
				'HumanVillage',
				'ScarletMansion',
				'DLC1_MagicForest',
				'DLC1_YoukaiMountain',
				'DLC2_EarthSpiritsPalace',
				'DLC5_Makai',
			],
			task: [
				{
					task: [
						'Side_HumanVillage_Loop_Mission_A',
						'Side_HumanVillage_Loop_Mission_B',
						'Side_HumanVillage_Loop_Mission_C',
						'Side_HumanVillage_Loop_Mission_D',
					],
				},
			],
		},
	},
	{
		id: 21,
		name: '桃子',
		description: '桃子树的果实，较为常见',
		type: -1,
		tags: [17, 31],
		dlc: 0,
		level: 3,
		price: 10,
		from: {
			buy: [
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{
					label: 'Merchant_LunarCapital_MoonRabbit',
					map: 'DLC5_LunarCapital',
				},
			],
			collect: [
				{ label: 'HakureiShrine_Tree_A', map: 'HakureiShrine' },
				{
					label: 'DLC1_MagicForest_Plant_Peach',
					map: 'DLC1_MagicForest',
				},
				{
					label: 'DLC4_GardenOfTheSun_Tree_Peach',
					map: 'DLC4_GardenOfTheSun',
				},
				{
					label: 'DLC5_LunarCapital_Tree_Peach',
					map: 'DLC5_LunarCapital',
				},
			],
			fishingAdvanced: [
				'DLC2_EarthSpiritsPalace',
				'DLC3_DivineSpiritMausoleum',
			],
		},
	},
	{
		id: 22,
		name: '白果',
		description: '白果树的果实，较为常见',
		type: -1,
		tags: [20],
		dlc: 0,
		level: 2,
		price: 7,
		from: {
			buy: [
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
				{
					label: 'Merchant_EarthSpiritsPalace_HellCrow',
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
			collect: [
				{ label: 'HumanVillage_Tree', map: 'HumanVillage' },
				{ label: 'HakureiShrine_TreeMushroom', map: 'HakureiShrine' },
				{ label: 'DLC1_MagicForest_Tree', map: 'DLC1_MagicForest' },
				{
					label: 'DLC1_YoukaiMountain_Tree',
					map: 'DLC1_YoukaiMountain',
				},
				{
					label: 'DLC2_EarthSpiritsPalace_Plant_Ginkgo',
					map: 'DLC2_EarthSpiritsPalace',
				},
				{
					label: 'DLC4_GardenOfTheSun_Tree_Ginkgo',
					map: 'DLC4_GardenOfTheSun',
				},
			],
			fishingAdvanced: ['DLC3_DivineSpiritMausoleum'],
		},
	},
	{
		id: 23,
		name: '虾',
		description: '分布在雾之湖和玄武泽的淡水虾，较为常见',
		type: 1,
		tags: [1, 16],
		dlc: 0,
		level: 2,
		price: 30,
		from: {
			collect: [
				[{ label: 'HumanVillage_Stream_A', map: 'HumanVillage' }, 15],
				[
					{ label: 'HumanVillage_Stream_B', map: 'HumanVillage' },
					10,
					16,
					18,
				],
				[
					{ label: 'HumanVillage_Stream_C', map: 'HumanVillage' },
					20,
					10,
					15,
				],
				{ label: 'ScarletMansion_Shrimp', map: 'ScarletMansion' },
				[{ label: 'BambooForest_Pond', map: 'BambooForest' }, 30],
				[
					{
						label: 'DLC1_YoukaiMountain_Water_Crab',
						map: 'DLC1_YoukaiMountain',
					},
					40,
				],
				{
					label: 'DLC3_MyourenTemple_Water_Shrimp',
					map: 'DLC3_MyourenTemple',
				},
				{
					labels: [
						'DLC3_DivineSpiritMausoleum_Water_Shrimp_A',
						'DLC3_DivineSpiritMausoleum_Water_Shrimp_B',
					],
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					labels: [
						'DLC3_DivineSpiritMausoleum_Water_Shrimp_A',
						'DLC3_DivineSpiritMausoleum_Water_Shrimp_B',
						'DLC3_DivineSpiritMausoleum_Water_Salmon_A',
						'DLC3_DivineSpiritMausoleum_Water_Salmon_B',
					],
					map: 'DLC3_DivineSpiritMausoleum',
				},
				[{ label: 'DLC5_Makai_Water_Fish', map: 'DLC5_Makai' }, 50],
				[{ excludedMaps: ['BeastForest'] }, true],
			],
			fishing: [
				'BeastForest',
				'BambooForest',
				'DLC4_GardenOfTheSun',
				'DLC4_ShiningNeedleCastle',
				'DLC5_LunarCapital',
			],
		},
	},
	{
		id: 24,
		name: '蜂蜜',
		description: '能从树上蜂巢采到的野生蜂蜜，较为常见',
		type: -1,
		tags: [17],
		dlc: 0,
		level: 2,
		price: 15,
		from: {
			buy: [
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
				{
					label: 'Merchant_MyourenTemple_Nazrin',
					map: 'DLC3_MyourenTemple',
				},
				{
					label: 'Merchant_GardenOfTheSun_SunFairy',
					map: 'DLC4_GardenOfTheSun',
				},
			],
			collect: [
				{ label: 'BeastForest_Plant_C', map: 'BeastForest' },
				{ label: 'BeastForest_Plant_C2', map: 'BeastForest' },
				{ label: 'BeastForest_Plant_C3', map: 'BeastForest' },
				{ label: 'BeastForest_Plant_C4', map: 'BeastForest' },
				[{ label: 'HumanVillage_Tree', map: 'HumanVillage' }, 20],
				[{ label: 'HakureiShrine_Tree_A', map: 'HakureiShrine' }, 40],
				[{ label: 'HakureiShrine_Tree_B', map: 'HakureiShrine' }, 30],
				[{ label: 'ScarletMansion_Plant', map: 'ScarletMansion' }, 50],
				[
					{
						label: 'DLC1_YoukaiMountain_Tree',
						map: 'DLC1_YoukaiMountain',
					},
					20,
				],
				{
					labels: [
						'DLC3_MyourenTemple_Plant_Honey_A',
						'DLC3_MyourenTemple_Plant_Honey_B',
					],
					map: 'DLC3_MyourenTemple',
				},
				{
					labels: [
						'DLC4_GardenOfTheSun_Tree_Honey_A',
						'DLC4_GardenOfTheSun_Tree_Honey_B',
					],
					map: 'DLC4_GardenOfTheSun',
				},
				{ label: 'DLC5_Makai_Tree_Honey', map: 'DLC5_Makai' },
			],
		},
	},
	{
		id: 25,
		name: '蝉蜕',
		description: '在树干上常常可以采集的昆虫外壳，较为常见',
		type: -1,
		tags: [24],
		dlc: 0,
		level: 1,
		price: 5,
		from: {
			collect: [
				[{ label: 'BeastForest_Plant_C', map: 'BeastForest' }, 85],
				[{ label: 'BeastForest_Plant_C2', map: 'BeastForest' }, 85],
				[{ label: 'BeastForest_Plant_C3', map: 'BeastForest' }, 85],
				[{ label: 'BeastForest_Plant_C4', map: 'BeastForest' }, 85],
				[
					{ label: 'BeastForest_Plant_A2', map: 'BeastForest' },
					10,
					10,
					11,
				],
				[
					{ label: 'BeastForest_Plant_A3', map: 'BeastForest' },
					10,
					10,
					11,
				],
				{ label: 'HakureiShrine_Tree_B', map: 'HakureiShrine' },
				{
					labels: [
						'DLC2_FormerHell_FreeOneself_A',
						'DLC2_FormerHell_FreeOneself_B',
					],
					map: 'DLC2_FormerHell',
				},
				[
					{
						label: 'DLC4_GardenOfTheSun_Tree_Dew',
						map: 'DLC4_GardenOfTheSun',
					},
					50,
					10,
					11,
				],
				{
					labels: [
						'DLC5_Makai_Tree_CicadaSlough_A',
						'DLC5_Makai_Tree_CicadaSlough_B',
					],
					map: 'DLC5_Makai',
				},
			],
			fishingAdvanced: ['HakureiShrine'],
		},
	},
	{
		id: 26,
		name: '幻昙华',
		description: '生长在沼泽中的奇迹之花，非常珍贵',
		type: -1,
		tags: [4, 5, 27, 29],
		dlc: 0,
		level: 5,
		price: 70,
		from: {
			collect: [
				[
					{ label: 'BeastForest_Plant_Gendonka', map: 'BeastForest' },
					false,
					16,
					18,
				],
				{
					label: 'DLC2_EarthSpiritsPalace_Plant_Gendonka_B',
					map: 'DLC2_EarthSpiritsPalace',
				},
				{
					labels: [
						'DLC2_EarthSpiritsPalace_Plant_Gendonka',
						'DLC2_EarthSpiritsPalace_Plant_Gendonka_B',
					],
					map: 'DLC2_EarthSpiritsPalace',
				},
				{
					label: 'DLC3_MyourenTemple_Plant_Gendonka',
					map: 'DLC3_MyourenTemple',
				},
			],
			fishingAdvanced: [
				'DLC2_FormerHell',
				'DLC4_GardenOfTheSun',
				'DLC5_Makai',
			],
			task: [
				{
					task: [
						'Side_HumanVillage_Loop_Mission_A',
						'Side_HumanVillage_Loop_Mission_B',
						'Side_HumanVillage_Loop_Mission_C',
						'Side_HumanVillage_Loop_Mission_D',
					],
				},
			],
		},
	},
	{
		id: 27,
		name: '露水',
		description: '清晨采回来的露水，有点珍贵',
		type: -1,
		tags: [7],
		dlc: 0,
		level: 1,
		price: 10,
		from: {
			buy: [
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					label: 'Merchant_GardenOfTheSun_SunFairy',
					map: 'DLC4_GardenOfTheSun',
				},
			],
			collect: [
				[
					{ label: 'BeastForest_Plant_A2', map: 'BeastForest' },
					false,
					10,
					11,
				],
				[
					{ label: 'BeastForest_Plant_A', map: 'BeastForest' },
					false,
					10,
					11,
				],
				[
					{ label: 'BeastForest_Plant_A3', map: 'BeastForest' },
					false,
					10,
					11,
				],
				[
					{ label: 'BamBooForest_MoonLightHerb', map: 'BeastForest' },
					60,
					17,
					18,
				],
				{ label: 'ScarletMansion_Plant', map: 'ScarletMansion' },
				[
					{
						labels: [
							'DLC1_MagicForest_Item_Dew_A',
							'DLC1_MagicForest_Item_Dew_B',
							'DLC1_MagicForest_Item_Dew_C',
						],
						map: 'DLC1_MagicForest',
					},
					false,
					10,
					11,
				],
				{
					labels: [
						'DLC3_DivineSpiritMausoleum_Dew_A',
						'DLC3_DivineSpiritMausoleum_Dew_B',
					],
					map: 'DLC3_DivineSpiritMausoleum',
				},
				[
					{
						label: 'DLC4_GardenOfTheSun_Tree_Dew',
						map: 'DLC4_GardenOfTheSun',
					},
					false,
					10,
					11,
				],
				[
					{
						labels: [
							'DLC5_Makai_Item_Dew_A',
							'DLC5_Makai_Item_Dew_B',
						],
						map: 'DLC5_Makai',
					},
					false,
					10,
					11,
				],
			],
		},
	},
	{
		id: 28,
		name: '竹笋',
		description: '从野外采回来的竹笋，较为常见',
		type: 2,
		tags: [2, 7],
		dlc: 0,
		level: 3,
		price: 40,
		from: {
			buy: [
				[{ label: 'Merchant_BeastForest', map: 'BeastForest' }, 50],
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{ label: 'Merchant_FormerHell_Ghost', map: 'DLC2_FormerHell' },
			],
			collect: [
				{ label: 'BamBooForest_BambooRoot', map: 'BambooForest' },
				[{ label: 'BamBooForest_Bamboo', map: 'BambooForest' }, 30],
				{
					label: 'DLC4_ShiningNeedleCastle_Plant_BambooShoot',
					map: 'DLC4_ShiningNeedleCastle',
				},
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Plant_Bamboo',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
			],
			fishingAdvanced: ['DLC3_MyourenTemple'],
		},
	},
	{
		id: 29,
		name: '黄油',
		description: '西餐常用的食材，可以轻松地给食物增加难以抗拒的香味',
		type: -1,
		tags: [6],
		dlc: 0,
		level: 2,
		price: 8,
		from: {
			buy: [
				{ label: 'Merchant_Goblin', map: 'ScarletMansion' },
				{
					label: 'Merchant_EarthSpiritsPalace_HellCrow',
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
		},
	},
	{
		id: 30,
		name: '面粉',
		description: '有多种用途，较为常见',
		type: -1,
		tags: [9],
		dlc: 0,
		level: 2,
		price: 10,
		from: {
			buy: [
				{ label: 'Merchant_Goblin', map: 'ScarletMansion' },
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
			],
		},
	},
	{
		id: 31,
		name: '竹子',
		description: '鲜翠欲滴的迷途竹林鲜切竹子，散发着清冽的竹香',
		type: -1,
		tags: [20],
		dlc: 0,
		level: 3,
		price: 15,
		from: {
			buy: [
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{
					label: 'Merchant_LunarCapital_MoonRabbit',
					map: 'DLC5_LunarCapital',
				},
			],
			collect: [
				[{ label: 'BamBooForest_BambooRoot', map: 'BambooForest' }, 50],
				{ label: 'BamBooForest_Bamboo', map: 'BambooForest' },
				{
					label: 'DLC4_ShiningNeedleCastle_Plant_Bamboo',
					map: 'DLC4_ShiningNeedleCastle',
				},
			],
			fishingAdvanced: ['BambooForest'],
		},
	},
	{
		id: 32,
		name: '糯米',
		description: '很有粘性的米，制作出来的料理或绵软适口，或鲜嫩弹牙',
		type: -1,
		tags: [],
		dlc: 0,
		level: 3,
		price: 15,
		from: {
			buy: [
				[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30],
				{ label: 'Merchant_YokaiRabbitDelicacy', map: 'BambooForest' },
				{
					label: 'Merchant_MagicForest_Shanghai',
					map: 'DLC1_MagicForest',
				},
			],
		},
	},
	{
		id: 33,
		name: '月光草',
		description: '永远亭的特产，由满月之夜的月光凝聚，非常珍贵',
		type: -1,
		tags: [7, 25, 27, 29],
		dlc: 0,
		level: 5,
		price: 70,
		from: {
			buy: [
				[
					{
						label: 'Merchant_YokaiRabbitDelicacy',
						map: 'BambooForest',
					},
					50,
				],
				{
					label: 'Merchant_EarthSpiritsPalace_HellCrow',
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
			collect: [
				[
					{ label: 'BamBooForest_MoonLightHerb', map: 'BeastForest' },
					false,
					17,
					18,
				],
				[
					{
						label: 'DLC2_EarthSpiritsPalace_Plant_Gendonka_B',
						map: 'DLC2_EarthSpiritsPalace',
					},
					20,
				],
				[
					{
						labels: [
							'DLC2_EarthSpiritsPalace_Plant_Gendonka',
							'DLC2_EarthSpiritsPalace_Plant_Gendonka_B',
						],
						map: 'DLC2_EarthSpiritsPalace',
					},
					20,
				],
				[
					{
						label: 'DLC4_GardenOfTheSun_Plant_MoonLightHerb',
						map: 'DLC4_GardenOfTheSun',
					},
					false,
					17,
					18,
				],
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Plant_MoonLightHerb',
						map: 'DLC4_ShiningNeedleCastle',
					},
					false,
					17,
					18,
				],
			],
			fishingAdvanced: [
				'ScarletMansion',
				'BambooForest',
				'DLC2_EarthSpiritsPalace',
			],
			task: [
				{
					task: [
						'Side_HumanVillage_Loop_Mission_A',
						'Side_HumanVillage_Loop_Mission_B',
						'Side_HumanVillage_Loop_Mission_C',
						'Side_HumanVillage_Loop_Mission_D',
					],
				},
			],
		},
	},
	{
		id: 34,
		name: '冰块',
		description: '水的固体形态，帮助食材保温，晶莹剔透',
		type: -1,
		tags: [21],
		dlc: 0,
		level: 1,
		price: 2,
		from: {
			buy: [[{ label: 'Rinnosuke', map: 'HumanVillage' }, 30]],
			collect: [
				{ label: 'ScarletMansion_Ice', map: 'ScarletMansion' },
				{
					label: 'DLC3_DivineSpiritMausoleum_Water_Ice',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			fishingAdvanced: ['ScarletMansion', 'DLC5_Makai'],
		},
	},
	{
		id: 35,
		name: '辣椒',
		description: '用于增加辣味的食材，评价非常两极',
		type: -1,
		tags: [34],
		dlc: 0,
		level: 1,
		price: 2,
		from: {
			buy: [
				{ label: 'Merchant_BeastForest', map: 'BeastForest' },
				{ label: 'Merchant_HumanVillage', map: 'HumanVillage' },
				{ label: 'Merchant_FormerHell_Ghost', map: 'DLC2_FormerHell' },
				{
					label: 'Merchant_MyourenTemple_Nazrin',
					map: 'DLC3_MyourenTemple',
				},
				{ label: 'Merchant_Makai_Clown', map: 'DLC5_Makai' },
			],
			collect: [
				[{ label: 'BeastForest_Plant_B', map: 'BeastForest' }, 10],
				[{ label: 'BeastForest_Plant_B2', map: 'BeastForest' }, 10],
				[
					{
						label: 'DLC1_YoukaiMountain_Plant_Potato',
						map: 'DLC1_YoukaiMountain',
					},
					10,
				],
				{ label: 'DLC5_Makai_Plant_Pepper', map: 'DLC5_Makai' },
			],
		},
	},
	{
		id: 36,
		name: '葡萄',
		description: '在红魔馆种植的用于酿酒的葡萄',
		type: -1,
		tags: [17, 31],
		dlc: 0,
		level: 1,
		price: 5,
		from: {
			buy: [
				[
					{
						label: 'Merchant_MagicForest_Shanghai',
						map: 'DLC1_MagicForest',
					},
					60,
				],
				[
					{
						label: 'Merchant_EarthSpiritsPalace_HellCrow',
						map: 'DLC2_EarthSpiritsPalace',
					},
					40,
				],
			],
			collect: [
				{
					labels: ['ScarletMansion_Grape', 'ScarletMansion_Grape_B'],
					map: 'ScarletMansion',
				},
				{
					label: 'DLC4_GardenOfTheSun_Plant_Grape',
					map: 'DLC4_GardenOfTheSun',
				},
			],
			fishingAdvanced: ['DLC3_MyourenTemple'],
		},
	},
	{
		id: 1000,
		name: '黄瓜',
		description:
			'河童的嗜好物。虽然用来做菜和普通蔬菜没有区别，但却能让河童无比上瘾。究竟是其中的什么成分在起作用……',
		type: 2,
		tags: [2, 3, 7],
		dlc: 1,
		level: 1,
		price: 7,
		from: {
			buy: [
				{
					label: 'Merchant_YoukaiMountain_Kappa',
					map: 'DLC1_YoukaiMountain',
				},
				[
					{
						label: 'Merchant_GardenOfTheSun_SunFairy',
						map: 'DLC4_GardenOfTheSun',
					},
					70,
				],
			],
			collect: [
				{
					label: 'DLC1_YoukaiMountain_Plant_Cucumber',
					map: 'DLC1_YoukaiMountain',
				},
			],
			fishingAdvanced: ['DLC1_YoukaiMountain'],
		},
	},
	{
		id: 1001,
		name: '章鱼',
		description:
			'鲜嫩可爱的海洋生物，但幻想乡没有海……它的脚是宝贝，有压倒性的肉质感，而且只要用最简单的火烤，就能享受弹牙的美味！',
		type: 1,
		tags: [1, 11, 16],
		dlc: 1,
		level: 2,
		price: 12,
		from: {
			buy: [
				{
					label: 'Merchant_YoukaiMountain_Kappa',
					map: 'DLC1_YoukaiMountain',
				},
			],
			collect: [
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
				[{ label: 'DLC5_Makai_Water_Fish', map: 'DLC5_Makai' }, 50],
			],
			fishing: ['DLC1_YoukaiMountain'],
		},
	},
	{
		id: 1002,
		name: '海胆',
		description:
			'据说在外界被称作传说级的食材，只要一小颗就能让人感受到整个海洋的美味，会是真的吗？样子长得倒是挺奇怪的……',
		type: 1,
		tags: [1, 4, 5, 11, 16],
		dlc: 1,
		level: 3,
		price: 18,
		from: {
			buy: [
				[
					{
						label: 'Merchant_YoukaiMountain_Kappa',
						map: 'DLC1_YoukaiMountain',
					},
					50,
				],
				[
					{
						label: 'Merchant_ShiningNeedleCastle_FuRyouShounenn',
						map: 'DLC4_ShiningNeedleCastle',
					},
					60,
				],
			],
			collect: [
				{
					label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
					map: 'DLC4_ShiningNeedleCastle',
				},
				[{ label: 'DLC5_Makai_Water_Fish', map: 'DLC5_Makai' }, 50],
			],
			fishingAdvanced: ['DLC1_YoukaiMountain'],
		},
	},
	{
		id: 1003,
		name: '黑盐',
		description:
			'火山能量，累积上千万年；只为净化，你灵魂的尘埃……广告词这样写着，其实就是普通的火山岩盐。',
		type: -1,
		tags: [15],
		dlc: 1,
		level: 1,
		price: 3,
		from: {
			buy: [
				[
					{
						label: 'Merchant_YoukaiMountain_Kappa',
						map: 'DLC1_YoukaiMountain',
					},
					80,
				],
				{
					label: 'Merchant_MyourenTemple_Nazrin',
					map: 'DLC3_MyourenTemple',
				},
			],
			collect: [
				{
					label: 'DLC1_YoukaiMountain_Item_Salt',
					map: 'DLC1_YoukaiMountain',
				},
			],
		},
	},
	{
		id: 1004,
		name: '奶油',
		description:
			'用非常特殊的方法处理的奶制品，无论什么时候都能秒杀甜食嗜好者的味蕾！',
		type: -1,
		tags: [3, 13, 17],
		dlc: 1,
		level: 1,
		price: 9,
		from: {
			buy: [
				[
					{
						label: 'Merchant_MagicForest_Shanghai',
						map: 'DLC1_MagicForest',
					},
					75,
				],
				{
					label: 'Merchant_MyourenTemple_Nazrin',
					map: 'DLC3_MyourenTemple',
				},
				{
					label: 'Merchant_GardenOfTheSun_SunFairy',
					map: 'DLC4_GardenOfTheSun',
				},
				{ label: 'Merchant_Makai_Clown', map: 'DLC5_Makai' },
			],
		},
	},
	{
		id: 1005,
		name: '螃蟹',
		description:
			'以为有了盔甲就可以横行霸道的八脚笨蛋，只需最简单的清蒸就能成为究极美味！不过要小心它的钳子……',
		type: 1,
		tags: [1, 4, 16],
		dlc: 1,
		level: 3,
		price: 10,
		from: {
			buy: [
				[
					{
						label: 'Merchant_YoukaiMountain_Kappa',
						map: 'DLC1_YoukaiMountain',
					},
					50,
				],
				[
					{
						label: 'Merchant_ShiningNeedleCastle_FuRyouShounenn',
						map: 'DLC4_ShiningNeedleCastle',
					},
					70,
				],
			],
			collect: [
				{
					label: 'DLC1_YoukaiMountain_Water_Crab',
					map: 'DLC1_YoukaiMountain',
				},
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
						map: 'DLC4_ShiningNeedleCastle',
					},
					30,
				],
				[{ label: 'DLC5_Makai_Water_Fish', map: 'DLC5_Makai' }, 50],
			],
			fishing: ['DLC1_YoukaiMountain'],
		},
	},
	{
		id: 2000,
		name: '并蒂莲',
		description:
			'根茎生长在桥的附近，花朵成熟后会破水而出，淡红色并有淡香味，高级食材，也是地底人的节日装饰。',
		type: -1,
		tags: [4, 5, 7, 25, 29],
		dlc: 2,
		level: 3,
		price: 36,
		from: {
			collect: [
				{
					label: 'DLC2_FormerHell_Water_Lotus',
					map: 'DLC2_FormerHell',
				},
				{
					label: 'DLC3_MyourenTemple_Water_Lotus',
					map: 'DLC3_MyourenTemple',
				},
				{
					label: 'DLC3_DivineSpiritMausoleum_Water_Lotus',
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					label: 'DLC5_LunarCapital_Water_Lotus',
					map: 'DLC5_LunarCapital',
				},
			],
			fishingAdvanced: [
				'DLC3_MyourenTemple',
				'DLC3_DivineSpiritMausoleum',
			],
		},
	},
	{
		id: 2001,
		name: '柠檬',
		description:
			'仅在桥附近特别的树上产出的奇怪果实，据说没有人能够无表情板着脸吃完一整颗，有着强大的“酸”味，只能取其果汁来调味。',
		type: -1,
		tags: [31, 2000],
		dlc: 2,
		level: 1,
		price: 8,
		from: {
			buy: [
				{
					label: 'Merchant_EarthSpiritsPalace_HellCrow',
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
			collect: [
				{ label: 'DLC2_FormerHell_Tree_Lemon', map: 'DLC2_FormerHell' },
			],
			fishingAdvanced: ['DLC2_FormerHell'],
		},
	},
	{
		id: 2002,
		name: '芝士',
		description:
			'浓郁的奶油熟成后的珍贵食材，取一片加热融化就能让料理变得奶香浓郁，美味十足。',
		type: -1,
		tags: [4, 15, 16],
		dlc: 2,
		level: 2,
		price: 18,
		from: {
			buy: [
				{
					label: 'Merchant_EarthSpiritsPalace_HellCrow',
					map: 'DLC2_EarthSpiritsPalace',
				},
				{
					label: 'Merchant_MyourenTemple_Nazrin',
					map: 'DLC3_MyourenTemple',
				},
			],
			collect: [
				{
					labels: [
						'DLC2_EarthSpiritsPalace_Item_Cheese_A',
						'DLC2_EarthSpiritsPalace_Item_Cheese_B',
					],
					map: 'DLC2_EarthSpiritsPalace',
				},
			],
		},
	},
	{
		id: 3000,
		name: '莲子',
		description:
			'非常古老的水生植物——莲的种子。莲子的芯很苦，千万得处理好，别混到料理给客人吃了。',
		type: -1,
		tags: [7, 19, 25],
		dlc: 3,
		level: 3,
		price: 22,
		from: {
			collect: [
				{
					label: 'DLC3_MyourenTemple_Water_LotusSeed_A',
					map: 'DLC3_MyourenTemple',
				},
				{
					label: 'DLC3_MyourenTemple_Water_LotusSeed_B',
					map: 'DLC3_MyourenTemple',
				},
				{
					label: 'DLC3_DivineSpiritMausoleum_Water_LotusSeed',
					map: 'DLC3_DivineSpiritMausoleum',
				},
				{
					label: 'DLC5_LunarCapital_Water_Lotus',
					map: 'DLC5_LunarCapital',
				},
			],
		},
	},
	{
		id: 3001,
		name: '地瓜',
		description:
			'世上最实在的食材！不仅香甜软糯，而且能强效地应对饥饿，在冬天还有暖手的效果。',
		type: -1,
		tags: [9],
		dlc: 3,
		level: 1,
		price: 8,
		from: {
			buy: [
				{
					label: 'Merchant_MyourenTemple_Nazrin',
					map: 'DLC3_MyourenTemple',
				},
			],
			collect: [
				{
					label: 'DLC3_MyourenTemple_SweetPotato',
					map: 'DLC3_MyourenTemple',
				},
			],
		},
	},
	{
		id: 3002,
		name: '松子',
		description:
			'红松树的种子，据说在外界已经被列为濒危物种，但在幻想乡仍然很常见。传说松子有延年益寿的功能，是古代道士辟谷时的常备之物。',
		type: -1,
		tags: [4, 7, 19],
		dlc: 3,
		level: 2,
		price: 15,
		from: {
			buy: [
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				{
					label: 'DLC3_DivineSpiritMausoleum_Tree_Pinecone',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
		},
	},
	{
		id: 3003,
		name: '板栗',
		description:
			'相传道教创始人修炼时，由于不爱荤腥，便栽了许多板栗树，以栗代饭。栗子种仁肥厚，营养丰富，不仅受到许多道教人士的推崇，也经常被农民用来代替粮食。',
		type: 2,
		tags: [2, 3],
		dlc: 3,
		level: 2,
		price: 10,
		from: {
			buy: [
				{
					label: 'Merchant_DivineSpiritMausoleum_Taoist',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
			collect: [
				{
					label: 'DLC3_DivineSpiritMausoleum_Tree_Chestnut',
					map: 'DLC3_DivineSpiritMausoleum',
				},
			],
		},
	},
	{
		id: 4000,
		name: '梅子',
		description:
			'果梅树结的果实，可以盐渍或干制。做成梅干后有种咸中带酸的特殊口感，能够大大激起食欲，且品尝后唇齿留甘，让人回味无穷。',
		type: -1,
		tags: [15, 28],
		dlc: 4,
		level: 1,
		price: 12,
		from: {
			buy: [
				{
					label: 'Merchant_ShiningNeedleCastle_FuRyouShounenn',
					map: 'DLC4_ShiningNeedleCastle',
				},
			],
			collect: [
				[
					{
						label: 'DLC4_ShiningNeedleCastle_Tree_RedBean',
						map: 'DLC4_ShiningNeedleCastle',
					},
					60,
				],
			],
			fishingAdvanced: ['DLC4_ShiningNeedleCastle'],
		},
	},
	{
		id: 4001,
		name: '红豆',
		description:
			'又称赤豆，是适应能力较强的草本植物，食用能够起到增强自身免疫力和抗病能力的效果。古代人觉得中风得病都是疫鬼作祟，所以有“赤豆打鬼”的传说。',
		type: -1,
		tags: [3],
		dlc: 4,
		level: 2,
		price: 18,
		from: {
			buy: [
				{
					label: 'Merchant_ShiningNeedleCastle_FuRyouShounenn',
					map: 'DLC4_ShiningNeedleCastle',
				},
				{
					label: 'Merchant_LunarCapital_MoonRabbit',
					map: 'DLC5_LunarCapital',
				},
			],
			collect: [
				{
					label: 'DLC4_ShiningNeedleCastle_Tree_RedBean',
					map: 'DLC4_ShiningNeedleCastle',
				},
			],
		},
	},
	{
		id: 4002,
		name: '鲜花',
		description:
			'一朵朵绚丽烂漫的鲜花扎成的花束。花儿们以生命为代价也要完成的事，必须要对此付出敬意！',
		type: -1,
		tags: [20, 29],
		dlc: 4,
		level: 3,
		price: 45,
		from: {
			collect: [
				{
					label: 'DLC4_GardenOfTheSun_Plant_Flower_A',
					map: 'DLC4_GardenOfTheSun',
				},
				{
					label: 'DLC4_GardenOfTheSun_Plant_Flower_B',
					map: 'DLC4_GardenOfTheSun',
				},
				{ label: 'DLC5_Makai_Plant_Flower', map: 'DLC5_Makai' },
			],
			fishingAdvanced: ['DLC4_GardenOfTheSun'],
		},
	},
	{
		id: 4003,
		name: '香椿',
		description:
			'一种常见的野菜。具有一定的毒性，不建议过量食用，并且食用前须焯水烹饪。',
		type: 2,
		tags: [2, 4001],
		dlc: 4,
		level: 2,
		price: 20,
		from: {
			buy: [
				{
					label: 'Merchant_GardenOfTheSun_SunFairy',
					map: 'DLC4_GardenOfTheSun',
				},
			],
			collect: [
				{
					label: 'DLC4_GardenOfTheSun_Plant_ToonaSinensis',
					map: 'DLC4_GardenOfTheSun',
				},
			],
		},
	},
	{
		id: 4004,
		name: '西红柿',
		description:
			'颜色鲜艳的浆果，曾经还因为太鲜艳被视为“狐狸的果实”，觉得它具有剧毒，所以只用来观赏。在发现可以食用以后就开始大面积种植了。',
		type: 2,
		tags: [2],
		dlc: 4,
		level: 1,
		price: 8,
		from: {
			collect: [
				{
					label: 'DLC4_GardenOfTheSun_Plant_Tomato',
					map: 'DLC4_GardenOfTheSun',
				},
			],
			fishingAdvanced: ['DLC4_GardenOfTheSun'],
		},
	},
	{
		id: 5000,
		name: '可可豆',
		description:
			'可可树的果实，据说在不同地区有不同的风味，有的会带点果香，有的带有烟熏的风味。可以磨成粉食用，是制作巧克力的基本原料。',
		type: -1,
		tags: [17, 27],
		dlc: 5,
		level: 3,
		price: 22,
		from: {
			buy: [
				[
					{
						label: 'DLC5_Makai_Merchant_Ellen_MagicShop',
						map: 'DLC5_Makai',
					},
					true,
				],
				[{ label: 'Merchant_Makai_Clown', map: 'DLC5_Makai' }, 75],
			],
			collect: [
				{ label: 'DLC5_Makai_Tree_CocoaBean', map: 'DLC5_Makai' },
			],
			fishing: ['DLC5_Makai'],
		},
	},
	{
		id: 5001,
		name: '西蓝花',
		description:
			'魔界土壤培育出来的西蓝花，因为光照不足植株徒长，花球颜色和地上也略微有些不同。',
		type: 2,
		tags: [2, 3],
		dlc: 5,
		level: 2,
		price: 18,
		from: {
			buy: [
				[
					{
						label: 'DLC5_Makai_Merchant_Ellen_MagicShop',
						map: 'DLC5_Makai',
					},
					true,
				],
				[{ label: 'Merchant_Makai_Clown', map: 'DLC5_Makai' }, 75],
			],
			collect: [
				{ label: 'DLC5_Makai_Plant_Broccoli', map: 'DLC5_Makai' },
			],
			fishing: ['DLC5_Makai'],
		},
	},
	{
		id: 5002,
		name: '噗噗呦果',
		description:
			'魔界里到处可见的怪异果子。似乎会根据食用者的类型产生不同的食用效果，十分奇特。',
		type: -1,
		tags: [5000],
		dlc: 5,
		level: 5,
		price: 10,
		from: {
			task: [{ task: 'DLC5_Challenge_ArrestMizuchi_Finished_Event' }],
		},
	},
	{
		id: 5003,
		name: '薜荔',
		description:
			'一种药食两用植物。将薜荔籽浸泡后搓汁，冷藏后会凝固成晶莹剔透的胶状物，可以用来制作果冻和凉粉等，是消暑神品。',
		type: -1,
		tags: [21, 29],
		dlc: 5,
		level: 2,
		price: 21,
		from: {
			buy: [
				[
					{
						label: 'Merchant_LunarCapital_MoonRabbit',
						map: 'DLC5_LunarCapital',
					},
					75,
				],
				[
					{
						label: 'DLC5_Makai_Merchant_Ellen_MagicShop',
						map: 'DLC5_Makai',
					},
					true,
				],
			],
			collect: [
				{
					label: 'DLC5_LunarCapital_Water_FicusPumila',
					map: 'DLC5_LunarCapital',
				},
			],
		},
	},
	{
		id: 5004,
		name: '银耳',
		description:
			'一种像花儿一样美丽的菌类。据说历代皇家贵族把银耳看作延年益寿之品，但在月都似乎很常见。这种看起来一尘不染的洁白，和月都的感觉很相称。',
		type: -1,
		tags: [7, 26],
		dlc: 5,
		level: 3,
		price: 14,
		from: {
			buy: [
				[
					{
						label: 'Merchant_LunarCapital_MoonRabbit',
						map: 'DLC5_LunarCapital',
					},
					75,
				],
				[
					{
						label: 'DLC5_Makai_Merchant_Ellen_MagicShop',
						map: 'DLC5_Makai',
					},
					true,
				],
			],
			collect: [
				{
					label: 'DLC5_LunarCapital_Water_FicusPumila',
					map: 'DLC5_LunarCapital',
				},
			],
			fishing: ['DLC5_LunarCapital'],
		},
	},
	{
		id: 5005,
		name: '强效辣椒素',
		description:
			'使用了月之科技制作的极•辣品，能让食用者留下恐怖的回忆。是不是真的用辣椒做的就说不清了……',
		type: -1,
		tags: [5000],
		dlc: 5,
		level: 5,
		price: 0,
		from: {
			task: [
				{
					task: [
						'DLC5_Challenge_PracticeA_Finished_Event',
						'DLC5_Challenge_PracticeB_Finished_Event',
						'DLC5_Challenge_PracticeC_Finished_Event',
					],
				},
			],
		},
	},
	{
		id: -1,
		name: '铃仙',
		description: '我是谁？？？我在哪？？？我为什么会在这里？？？',
		type: -1,
		tags: [19, 20, 27, 30],
		dlc: 0,
		level: 10,
		price: 530000,
		from: { buy: [[{ label: '“强买强卖”商店', specialGuest: 29 }, 15]] },
	},
	{
		id: 11000,
		name: '金箔',
		description: '用高纯度黄金反复捶打制成的食材，能让食物看起来更加昂贵。',
		type: -1,
		tags: [-3, 4, 20],
		dlc: 9,
		level: 4,
		price: 96,
		from: { buy: [[{ specialGuest: 11000, map: 'HumanVillage' }, 60]] },
	},
	{
		id: 11001,
		name: '椰子',
		description:
			'不知道从哪流入的外来食材，坚硬的外壳下有美味的果肉和丰富的汁水。',
		type: -1,
		tags: [17, 31],
		dlc: 9,
		level: 2,
		price: 8,
		from: { buy: [[{ specialGuest: 11000, map: 'HumanVillage' }, 90]] },
	},
	{
		id: 11002,
		name: '仙人掌',
		description: '浑身长满刺的食材，需要细心处理后才能食用。',
		type: 2,
		tags: [2, 2000],
		dlc: 9,
		level: 2,
		price: 4,
		from: { buy: [[{ specialGuest: 11000, map: 'HumanVillage' }, 80]] },
	},
	{
		id: 11003,
		name: '大葱',
		description:
			'人间之里产的食材，十分常见。作为调味品或是直接吃都是个不错的选择。',
		type: 2,
		tags: [2, 34],
		dlc: 9,
		level: 1,
		price: 4,
		from: { buy: [{ specialGuest: 11000, map: 'HumanVillage' }] },
	},
	{
		id: 11004,
		name: '大蒜',
		description: '人间之里产的食材，十分常见。传闻对吸血鬼有独特的杀伤力。',
		type: 2,
		tags: [2, 34],
		dlc: 9,
		level: 1,
		price: 4,
		from: { buy: [{ specialGuest: 11000, map: 'HumanVillage' }] },
	},
	{
		id: 11005,
		name: '玉米',
		description:
			'人间之里产的食材，十分常见。既可以作为主食，也可以拿来煲汤。',
		type: 2,
		tags: [2, 3, 17],
		dlc: 9,
		level: 1,
		price: 4,
		from: { buy: [{ specialGuest: 11001, map: 'HumanVillage' }] },
	},
	{
		id: 11006,
		name: '炼乳',
		description: '经过精炼的奶制品，甜度非同寻常，适合用来制作甜点类料理。',
		type: -1,
		tags: [17],
		dlc: 9,
		level: 3,
		price: 35,
		from: { buy: [[{ specialGuest: 11001, map: 'HumanVillage' }, 90]] },
	},
	{
		id: 11007,
		name: '棉花糖',
		description:
			'直接拿来吃或者用来做菜都非常不错的小零食，很受孩子们的欢迎。',
		type: -1,
		tags: [17, 20],
		dlc: 9,
		level: 2,
		price: 15,
		from: { buy: [[{ specialGuest: 11001, map: 'HumanVillage' }, 90]] },
	},
] as const satisfies IIngredient[];
