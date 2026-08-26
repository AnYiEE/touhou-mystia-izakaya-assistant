import type { TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import type { TPrayerLabel } from '@/domain/data/labels/prayerFacts';
import type { TCollectableLabel } from '@/domain/data/places/collectableLabels';
import type { TMerchantLabel } from '@/domain/data/places/merchantFacts';

export type TMapLabel =
	| 'BeastForest'
	| 'HumanVillage'
	| 'HakureiShrine'
	| 'ScarletMansion'
	| 'BambooForest'
	| 'DLC1_MagicForest'
	| 'DLC1_YoukaiMountain'
	| 'DLC2_FormerHell'
	| 'DLC2_EarthSpiritsPalace'
	| 'DLC3_MyourenTemple'
	| 'DLC3_DivineSpiritMausoleum'
	| 'DLC4_GardenOfTheSun'
	| 'DLC4_ShiningNeedleCastle'
	| 'DLC5_LunarCapital'
	| 'DLC5_Makai';

export type TMapDisplayLabel =
	| '妖怪兽道'
	| '人间之里'
	| '博丽神社'
	| '红魔馆'
	| '迷途竹林'
	| '魔法森林'
	| '妖怪之山'
	| '旧地狱'
	| '地灵殿'
	| '命莲寺'
	| '神灵庙'
	| '太阳花田'
	| '辉针城'
	| '月之都'
	| '魔界';

export type TPlaceLabel = TMapLabel | 'Hakugyokurou';

export type TPlaceDisplayLabel = TMapDisplayLabel | '白玉楼';

export interface IMapMerchantReference {
	label: TMerchantLabel;
	map: TMapLabel;
	specialGuest?: never;
}

export interface ISpecialGuestMapMerchantReference {
	label?: never;
	map: 'HumanVillage';
	specialGuest: 11000 | 11001;
}

export interface ISpecialGuestShopReference {
	label: '“强买强卖”商店';
	map?: never;
	specialGuest: 29;
}

export type TMerchantReference =
	| IMapMerchantReference
	| ISpecialGuestMapMerchantReference
	| ISpecialGuestShopReference;

export interface IPrayerReference {
	label: TPrayerLabel;
	map: TMapLabel;
}

export interface IMapCollectionPointReference {
	excludedMaps?: never;
	label: TCollectableLabel;
	labels?: never;
	map: TMapLabel;
}

export interface IMapCollectionPointGroupReference {
	excludedMaps?: never;
	label?: never;
	labels: readonly [TCollectableLabel, ...TCollectableLabel[]];
	map: TMapLabel;
}

export interface IExcludedMapCollectionPointReference {
	excludedMaps: readonly [TMapLabel, ...TMapLabel[]];
	label?: never;
	labels?: never;
	map?: never;
}

export type TCollectionPointReference =
	| IExcludedMapCollectionPointReference
	| IMapCollectionPointGroupReference
	| IMapCollectionPointReference;

export interface ITaskReference {
	task: TSchedulerLabel | readonly [TSchedulerLabel, ...TSchedulerLabel[]];
}
