import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TSpeed } from '@/domain/data/shared/types';

type TPartnerDialogueOptionLabel = '重修「第二次试炼」';
type TPartnerStoryPlaceLabel = '白玉楼';
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
				placeLabel: TPartnerStoryPlaceLabel;
				prerequisiteLabel: TPartnerStoryPrerequisiteLabel;
				specialGuest: TSpecialGuestId;
			};
	  };

export interface IPartner extends IItemBase {
	effect: string | null;
	from: TPartnerSource;
	pay: number;
	specialGuests: TSpecialGuestId[] | null;
	speed: { moving: TSpeed; working: Exclude<TSpeed, '瞬间移动'> };
}
