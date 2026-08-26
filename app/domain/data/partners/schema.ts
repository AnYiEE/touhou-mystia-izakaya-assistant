import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMapLabel, TPlaceLabel } from '@/domain/data/places/types';
import type { TSpeedLabel } from '@/domain/data/partners/speedFacts';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

type TPartnerDialogueOptionLabel = '重修「第二次试炼」';
type TPartnerStoryPrerequisiteLabel = '完成主线剧情';

export type TPartnerSource =
	| { self: true }
	| { mapMainTask: { map: TMapLabel } }
	| { allMapSpecialGuestBondsMaxed: { map: TMapLabel } }
	| { unlockedMapDialogue: { map: TMapLabel; specialGuest: TSpecialGuestId } }
	| {
			datedMapTrial: {
				day: number;
				map: TMapLabel;
				month: number;
				specialGuest: TSpecialGuestId;
			};
	  }
	| {
			storyDialogue: {
				dialogueOptionLabel: TPartnerDialogueOptionLabel;
				placeLabel: TPlaceLabel;
				prerequisiteLabel: TPartnerStoryPrerequisiteLabel;
				specialGuest: TSpecialGuestId;
			};
	  };

export interface IPartner extends IItemBase {
	effect: string | null;
	from: TPartnerSource;
	pay: number;
	specialGuests: TSpecialGuestId[] | null;
	speed: { moving: TSpeedLabel; working: Exclude<TSpeedLabel, 'None'> };
}
