import type { TCollectionPointReference } from './types';

type TCollectionPointRefreshFact = TCollectionPointReference & {
	displayLabel: string;
	refreshTimeHours: number | null;
};

export const COLLECTION_POINT_REFRESH_FACTS = [
	{
		displayLabel: '河流',
		excludedMaps: ['BeastForest'],
		refreshTimeHours: null,
	},
	{
		displayLabel: '河流',
		excludedMaps: ['BambooForest'],
		refreshTimeHours: null,
	},
	{
		displayLabel: '捕兽夹',
		labels: ['BeastForest_Trap', 'BeastForest_Trap2'],
		map: 'BeastForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '东北侧蜂巢',
		label: 'BeastForest_Plant_C3',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '东侧山丘（需借道博丽神社）',
		label: 'BeastForest_Plant_Gendonka',
		map: 'BeastForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '东南侧蜂巢',
		label: 'BeastForest_Plant_C4',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '东南侧雀酒',
		label: 'BeastForest_Bamboo',
		map: 'BeastForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '露水点（南侧亭子）',
		label: 'BeastForest_Plant_A2',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '露水点（小屋后方）',
		label: 'BeastForest_Plant_A3',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '露水点（小屋前方）',
		label: 'BeastForest_Plant_A',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '码头',
		label: 'BeastForest_OtterFestival',
		map: 'BeastForest',
		refreshTimeHours: 36,
	},
	{
		displayLabel: '南侧亭子（需借道迷途竹林）',
		label: 'BamBooForest_MoonLightHerb',
		map: 'BeastForest',
		refreshTimeHours: 48,
	},
	{
		displayLabel: '水涡（码头左上）',
		label: 'BeastForest_Stream_C',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '水涡（码头左下）',
		label: 'BeastForest_Stream_A2',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '水涡（木桥上方右侧二）',
		label: 'BeastForest_Stream_C2',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '水涡（木桥上方右侧三）',
		label: 'BeastForest_Stream_B',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '水涡（木桥上方右侧四）',
		label: 'BeastForest_Stream_A3',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '水涡（木桥上方右侧一）',
		label: 'BeastForest_Stream_B2',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '水涡（木桥上方左侧）',
		label: 'BeastForest_Stream_A',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '西侧花丛',
		label: 'BeastForest_Plant_B',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '西南侧蜂巢',
		label: 'BeastForest_Plant_C2',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '中部蜂巢',
		label: 'BeastForest_Plant_C',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '中部花丛',
		label: 'BeastForest_Plant_B2',
		map: 'BeastForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '鸡窝',
		label: 'HumanVillage_Chicken',
		map: 'HumanVillage',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '农田',
		labels: [
			'HumanVillage_Farmland_A',
			'HumanVillage_Farmland_B',
			'HumanVillage_Farmland_C',
		],
		map: 'HumanVillage',
		refreshTimeHours: 48,
	},
	{
		displayLabel: '水涡（湖泊右下）',
		label: 'HumanVillage_Stream_B',
		map: 'HumanVillage',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '水涡（湖泊左下）',
		label: 'HumanVillage_Stream_A',
		map: 'HumanVillage',
		refreshTimeHours: 1,
	},
	{
		displayLabel: '水涡（码头左侧）',
		label: 'HumanVillage_Stream_C',
		map: 'HumanVillage',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '银杏树',
		label: 'HumanVillage_Tree',
		map: 'HumanVillage',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '东侧银杏树',
		label: 'HakureiShrine_TreeMushroom',
		map: 'HakureiShrine',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '花丛',
		label: 'HakureiShrine_Potato',
		map: 'HakureiShrine',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '蘑菇堆（西侧）',
		label: 'HakureiShrine_Mushroom',
		map: 'HakureiShrine',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '桃树（蜂蜜）',
		label: 'HakureiShrine_Tree_A',
		map: 'HakureiShrine',
		refreshTimeHours: 48,
	},
	{
		displayLabel: '西南侧蝉蜕树',
		label: 'HakureiShrine_Tree_B',
		map: 'HakureiShrine',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '冰块堆',
		label: 'ScarletMansion_Ice',
		map: 'ScarletMansion',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '露水点',
		label: 'ScarletMansion_Plant',
		map: 'ScarletMansion',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '葡萄架',
		labels: ['ScarletMansion_Grape', 'ScarletMansion_Grape_B'],
		map: 'ScarletMansion',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '水涡（河流右侧）',
		label: 'ScarletMansion_Tuna',
		map: 'ScarletMansion',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '水涡（河流左侧）',
		label: 'ScarletMansion_Shrimp',
		map: 'ScarletMansion',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '西南侧蘑菇堆',
		label: 'BamBooForest_Mushroom_A',
		map: 'BambooForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '东北侧蘑菇堆',
		label: 'BamBooForest_Mushroom_B',
		map: 'BambooForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '水涡',
		label: 'BambooForest_Pond',
		map: 'BambooForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '西侧泉水',
		label: 'BambooForest_Rocket',
		map: 'BambooForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '竹笋堆',
		label: 'BamBooForest_BambooRoot',
		map: 'BambooForest',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '竹子',
		label: 'BamBooForest_Bamboo',
		map: 'BambooForest',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '露水点',
		labels: [
			'DLC1_MagicForest_Item_Dew_A',
			'DLC1_MagicForest_Item_Dew_B',
			'DLC1_MagicForest_Item_Dew_C',
		],
		map: 'DLC1_MagicForest',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '萝卜',
		label: 'DLC1_MagicForest_Plant_Radish',
		map: 'DLC1_MagicForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '蘑菇堆',
		labels: [
			'DLC1_MagicForest_Plant_Mushroom_A',
			'DLC1_MagicForest_Plant_Mushroom_B',
			'DLC1_MagicForest_Plant_Mushroom_C',
		],
		map: 'DLC1_MagicForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '桃子',
		label: 'DLC1_MagicForest_Plant_Peach',
		map: 'DLC1_MagicForest',
		refreshTimeHours: 48,
	},
	{
		displayLabel: '银杏树',
		label: 'DLC1_MagicForest_Tree',
		map: 'DLC1_MagicForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '中部树根',
		label: 'DLC1_MagicForest_Item_GoblinRain',
		map: 'DLC1_MagicForest',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '捕兽夹',
		label: 'DLC1_YoukaiMountain_Trap',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '黑盐',
		label: 'DLC1_YoukaiMountain_Item_Salt',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '花丛',
		label: 'DLC1_YoukaiMountain_Plant_Potato',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '黄瓜堆',
		label: 'DLC1_YoukaiMountain_Plant_Cucumber',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '南侧瀑布',
		label: 'DLC1_YoukaiMountain_Water_Salmon',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '西北瀑布',
		label: 'DLC1_YoukaiMountain_Water_Crab',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '银杏树蜂巢',
		label: 'DLC1_YoukaiMountain_Tree',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '中心瀑布',
		label: 'DLC1_YoukaiMountain_Water_Trout',
		map: 'DLC1_YoukaiMountain',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '捕兽夹（东侧）',
		label: 'DLC2_FormerHell_Item_BlackHairPork',
		map: 'DLC2_FormerHell',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '捕兽夹（中部）',
		label: 'DLC2_FormerHell_Item_WagyuBeef',
		map: 'DLC2_FormerHell',
		refreshTimeHours: 6,
	},
	{
		displayLabel: '蝉蜕树',
		labels: [
			'DLC2_FormerHell_FreeOneself_A',
			'DLC2_FormerHell_FreeOneself_B',
		],
		map: 'DLC2_FormerHell',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '拱桥（上方）',
		label: 'DLC2_FormerHell_Water_Salmon',
		map: 'DLC2_FormerHell',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '拱桥（下方）',
		label: 'DLC2_FormerHell_Water_Lotus',
		map: 'DLC2_FormerHell',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '鸡窝',
		label: 'DLC2_FormerHell_Item_Egg',
		map: 'DLC2_FormerHell',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '柠檬树',
		label: 'DLC2_FormerHell_Tree_Lemon',
		map: 'DLC2_FormerHell',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '仓库',
		labels: [
			'DLC2_EarthSpiritsPalace_Item_Cheese_A',
			'DLC2_EarthSpiritsPalace_Item_Cheese_B',
		],
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 6,
	},
	{
		displayLabel: '酒水架（北侧）',
		label: 'DLC2_EarthSpiritsPalace_Beverage_A',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '酒水架（南侧）',
		label: 'DLC2_EarthSpiritsPalace_Beverage_C',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '酒水架（西北侧）',
		label: 'DLC2_EarthSpiritsPalace_Beverage_B',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 8,
	},
	{
		displayLabel: '喷泉（东北侧）',
		label: 'DLC2_EarthSpiritsPalace_Plant_Ginkgo',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '喷泉（东侧）',
		label: 'DLC2_EarthSpiritsPalace_Plant_Gendonka_B',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 8,
	},
	{
		displayLabel: '喷泉（东南侧）',
		label: 'DLC2_EarthSpiritsPalace_Water_Puffer',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 8,
	},
	{
		displayLabel: '喷泉（西南侧）',
		label: 'DLC2_EarthSpiritsPalace_Water_Salmon',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '喷泉西侧蘑菇堆',
		label: 'DLC2_EarthSpiritsPalace_Plant_Truffle',
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 6,
	},
	{
		displayLabel: '游乐场',
		labels: [
			'DLC2_EarthSpiritsPalace_Plant_Gendonka',
			'DLC2_EarthSpiritsPalace_Plant_Gendonka_B',
		],
		map: 'DLC2_EarthSpiritsPalace',
		refreshTimeHours: 8,
	},
	{
		displayLabel: '蜂巢',
		labels: [
			'DLC3_MyourenTemple_Plant_Honey_A',
			'DLC3_MyourenTemple_Plant_Honey_B',
		],
		map: 'DLC3_MyourenTemple',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '花丛（西北侧）',
		label: 'DLC3_MyourenTemple_SweetPotato',
		map: 'DLC3_MyourenTemple',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '花丛（西南侧）',
		label: 'DLC3_MyourenTemple_Plant_Gendonka',
		map: 'DLC3_MyourenTemple',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '莲花池（右侧）',
		label: 'DLC3_MyourenTemple_Water_LotusSeed_A',
		map: 'DLC3_MyourenTemple',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '莲花池（中部右）',
		label: 'DLC3_MyourenTemple_Water_Shrimp',
		map: 'DLC3_MyourenTemple',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '莲花池（中部左）',
		label: 'DLC3_MyourenTemple_Water_LotusSeed_B',
		map: 'DLC3_MyourenTemple',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '莲花池（左侧）',
		label: 'DLC3_MyourenTemple_Water_Lotus',
		map: 'DLC3_MyourenTemple',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '冰块堆',
		label: 'DLC3_DivineSpiritMausoleum_Water_Ice',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '拱桥（下方）',
		label: 'DLC3_DivineSpiritMausoleum_Water_Lotus',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '露水点',
		labels: [
			'DLC3_DivineSpiritMausoleum_Dew_A',
			'DLC3_DivineSpiritMausoleum_Dew_B',
		],
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '水涡（东侧）',
		label: 'DLC3_DivineSpiritMausoleum_Water_Tunas_B',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '水涡（拱桥上方）',
		labels: [
			'DLC3_DivineSpiritMausoleum_Water_Shrimp_A',
			'DLC3_DivineSpiritMausoleum_Water_Shrimp_B',
		],
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '水涡（河流上方）',
		labels: [
			'DLC3_DivineSpiritMausoleum_Water_Salmon_A',
			'DLC3_DivineSpiritMausoleum_Water_Salmon_B',
			'DLC3_DivineSpiritMausoleum_Water_Shrimp_A',
			'DLC3_DivineSpiritMausoleum_Water_Shrimp_B',
		],
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '水涡（木桥西侧）',
		labels: [
			'DLC3_DivineSpiritMausoleum_Water_Salmon_A',
			'DLC3_DivineSpiritMausoleum_Water_Salmon_B',
		],
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '水涡（入口楼梯上方）',
		label: 'DLC3_DivineSpiritMausoleum_Water_Eel',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '水涡（入口楼梯下方）',
		label: 'DLC3_DivineSpiritMausoleum_Water_Tunas_A',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '西南侧莲花',
		label: 'DLC3_DivineSpiritMausoleum_Water_LotusSeed',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '中部栗树',
		label: 'DLC3_DivineSpiritMausoleum_Tree_Chestnut',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '中部松树',
		label: 'DLC3_DivineSpiritMausoleum_Tree_Pinecone',
		map: 'DLC3_DivineSpiritMausoleum',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '东侧向日葵丛（风祝/尼格罗尼）',
		labels: [
			'DLC4_GardenOfTheSun_Beverage_A',
			'DLC4_GardenOfTheSun_Beverage_B',
		],
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 8,
	},
	{
		displayLabel: '东侧向日葵丛（水獭祭）',
		label: 'DLC4_GardenOfTheSun_Beverage_OtterFestival',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '蜂巢',
		labels: [
			'DLC4_GardenOfTheSun_Tree_Honey_A',
			'DLC4_GardenOfTheSun_Tree_Honey_B',
		],
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '花丛（西侧）',
		label: 'DLC4_GardenOfTheSun_Plant_Flower_A',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '花丛（中部）',
		label: 'DLC4_GardenOfTheSun_Plant_Flower_B',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '露水点',
		label: 'DLC4_GardenOfTheSun_Tree_Dew',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '蘑菇堆',
		label: 'DLC4_GardenOfTheSun_Plant_Mushroom',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '葡萄架',
		label: 'DLC4_GardenOfTheSun_Plant_Grape',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '树桩',
		label: 'DLC4_GardenOfTheSun_Beverage_Bamboo',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '桃树',
		label: 'DLC4_GardenOfTheSun_Tree_Peach',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '温室',
		label: 'DLC4_GardenOfTheSun_Plant_Radish',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '西北香椿树',
		label: 'DLC4_GardenOfTheSun_Plant_ToonaSinensis',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 6,
	},
	{
		displayLabel: '银杏树',
		label: 'DLC4_GardenOfTheSun_Tree_Ginkgo',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '月光草',
		label: 'DLC4_GardenOfTheSun_Plant_MoonLightHerb',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '中部温室',
		label: 'DLC4_GardenOfTheSun_Plant_Tomato',
		map: 'DLC4_GardenOfTheSun',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '红豆树',
		label: 'DLC4_ShiningNeedleCastle_Tree_RedBean',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '酒窖',
		label: 'DLC4_ShiningNeedleCastle_RandomBeverage',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 8,
	},
	{
		displayLabel: '巨碗后方',
		label: 'DLC4_ShiningNeedleCastle_Bowl_SeaUrchin',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '水涡（上方）',
		label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_A',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '水涡（下方）',
		label: 'DLC4_ShiningNeedleCastle_Water_RandomFish_B',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '月光草',
		label: 'DLC4_ShiningNeedleCastle_Plant_MoonLightHerb',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '竹笋堆',
		label: 'DLC4_ShiningNeedleCastle_Plant_BambooShoot',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '竹子',
		label: 'DLC4_ShiningNeedleCastle_Plant_Bamboo',
		map: 'DLC4_ShiningNeedleCastle',
		refreshTimeHours: 12,
	},
	{
		displayLabel: '桃树',
		label: 'DLC5_LunarCapital_Tree_Peach',
		map: 'DLC5_LunarCapital',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '月虹池（右上）',
		label: 'DLC5_LunarCapital_Water_Beverage',
		map: 'DLC5_LunarCapital',
		refreshTimeHours: 8,
	},
	{
		displayLabel: '月虹池（右下）',
		label: 'DLC5_LunarCapital_Water_Lotus',
		map: 'DLC5_LunarCapital',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '月虹池（左上）',
		label: 'DLC5_LunarCapital_Water_FicusPumila',
		map: 'DLC5_LunarCapital',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '月虹池（左下）',
		label: 'DLC5_LunarCapital_Water_FishAndMeat',
		map: 'DLC5_LunarCapital',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '蝉蜕树',
		labels: [
			'DLC5_Makai_Tree_CicadaSlough_A',
			'DLC5_Makai_Tree_CicadaSlough_B',
		],
		map: 'DLC5_Makai',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '东侧可可树',
		label: 'DLC5_Makai_Tree_CocoaBean',
		map: 'DLC5_Makai',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '东南侧花丛',
		label: 'DLC5_Makai_Plant_Flower',
		map: 'DLC5_Makai',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '蜂巢',
		label: 'DLC5_Makai_Tree_Honey',
		map: 'DLC5_Makai',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '河流',
		label: 'DLC5_Makai_Water_Fish',
		map: 'DLC5_Makai',
		refreshTimeHours: 4,
	},
	{
		displayLabel: '辣椒丛',
		label: 'DLC5_Makai_Plant_Pepper',
		map: 'DLC5_Makai',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '露水点',
		labels: ['DLC5_Makai_Item_Dew_A', 'DLC5_Makai_Item_Dew_B'],
		map: 'DLC5_Makai',
		refreshTimeHours: 2,
	},
	{
		displayLabel: '魅魔房顶',
		label: 'DLC5_Makai_Roof_Beverage',
		map: 'DLC5_Makai',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '蘑菇堆',
		labels: [
			'DLC5_Makai_Plant_Mushroom_A',
			'DLC5_Makai_Plant_Mushroom_B',
			'DLC5_Makai_Plant_Mushroom_C',
			'DLC5_Makai_Plant_Mushroom_D',
			'DLC5_Makai_Plant_Mushroom_E',
		],
		map: 'DLC5_Makai',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '西北侧妖精雨露',
		label: 'DLC5_Makai_Item_GoblinRain',
		map: 'DLC5_Makai',
		refreshTimeHours: 24,
	},
	{
		displayLabel: '西南侧西蓝花丛',
		label: 'DLC5_Makai_Plant_Broccoli',
		map: 'DLC5_Makai',
		refreshTimeHours: 24,
	},
] as const satisfies ReadonlyArray<TCollectionPointRefreshFact>;

export function getCollectionPointReferenceKey(
	reference: TCollectionPointReference
) {
	if ('excludedMaps' in reference) {
		return JSON.stringify(['excludedMaps', reference.excludedMaps]);
	}
	if ('labels' in reference) {
		return JSON.stringify([
			'labels',
			reference.map,
			reference.labels.toSorted(),
		]);
	}
	return JSON.stringify(['label', reference.map, reference.label]);
}

export function getCollectionPointFact(reference: TCollectionPointReference) {
	const key = getCollectionPointReferenceKey(reference);
	return COLLECTION_POINT_REFRESH_FACTS.find(
		(candidate) => getCollectionPointReferenceKey(candidate) === key
	);
}
