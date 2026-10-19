import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
	faBed,
	faBookOpen,
	faBoxOpen,
	faCoins,
	faDice,
	faDisplay,
	faGamepad,
	faGift,
	faHandsPraying,
	faImages,
	faMusic,
	faPhone,
	faRecordVinyl,
	faShirt,
	faTrophy,
	faUtensils,
	faWarehouse,
	faWineBottle,
} from '@fortawesome/free-solid-svg-icons';

import type { TDayMapInteractionKind } from '@/domain/data/maps/types';

const DAY_MAP_INTERACTION_ICONS = {
	'200k-congratulation-pic': faImages,
	bed: faBed,
	'beverage-storage': faWineBottle,
	'cg-gallery': faImages,
	closet: faShirt,
	'comic-book': faBookOpen,
	'congratulation-pic': faImages,
	'cooking-table': faUtensils,
	'creator-box': faBoxOpen,
	'donation-box': faCoins,
	fanart: faImages,
	'food-storage': faWarehouse,
	'jizo-doll': faHandsPraying,
	'lunar-console': faGamepad,
	'music-machine': faMusic,
	'music-player': faRecordVinyl,
	'repeat-challenge': faTrophy,
	showcase: faDisplay,
	'slot-machine': faDice,
	telephone: faPhone,
	'ten-thousand-sales': faGift,
} as const satisfies Record<TDayMapInteractionKind, IconDefinition>;

export function getDayMapInteractionIcon(kind: TDayMapInteractionKind) {
	return DAY_MAP_INTERACTION_ICONS[kind];
}
