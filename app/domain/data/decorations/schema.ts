import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { type TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import { type TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

interface IDecorationFrom {
	bond?: { level: number; specialGuest: TSpecialGuestId };
	collaboration?: {
		collaborationLabel: Extract<
			TCollaborationLabel,
			'ResourceEx_GiftMailbox' | 'TBS_Kokoro'
		>;
	};
	completion?: {
		maps: readonly [TMapLabel, TMapLabel];
		specialGuest: TSpecialGuestId;
		story: { conditionLabel: '全部剧情'; dlc: 5 };
	};
	task?: {
		map: 'ScarletMansion';
		missionLabel: Extract<
			TSchedulerLabel,
			'DLC4_Kizuna_ImaizumiKagerou_LV4_Upgrade_Mission'
		>;
		startEventLabel: Extract<
			TSchedulerLabel,
			'DLC4_Kizuna_ImaizumiKagerou_LV4_Upgrade_TalkWakasagihime_Event'
		>;
	};
}

export interface IDecoration extends IItemBase {
	effect: string;
	from: IDecorationFrom;
}
