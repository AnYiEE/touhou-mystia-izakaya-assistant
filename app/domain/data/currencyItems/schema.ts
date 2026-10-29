import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { type TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import { type TPrayerLabel } from '@/domain/data/labels/prayerFacts';
import type { TMapLabel, TMerchantReference } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TCurrencyItemId } from './types';

interface ICurrencyItemFrom<TId extends number = TCurrencyItemId> {
	buy?: {
		merchant: TMerchantReference;
		price: { amount: number; currencyItem: TId };
	};
	collaboration?: {
		collaborationLabel: Extract<
			TCollaborationLabel,
			'ResourceEx_GiftMailbox'
		>;
	};
	mapPrayer?: { label: TPrayerLabel; map: TMapLabel };
	mapSideTask?: { map: TMapLabel };
	spellCardReward?: { specialGuest: TSpecialGuestId };
}

export interface ICurrencyItem<
	TId extends number = TCurrencyItemId,
> extends IItemBase {
	from: ICurrencyItemFrom<TId>;
	id: TId;
}
