import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import type { TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

interface IDecorationBondSource {
	bond: { level: number; specialGuest: TSpecialGuestId };
}

interface IDecorationBondTaskSource extends IDecorationBondSource {
	task: {
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

interface IDecorationCollaborationSource {
	collaboration: {
		collaborationLabel: Extract<TCollaborationLabel, 'TBS_Kokoro'>;
	};
}

interface IDecorationCompletionSource {
	completion: {
		maps: readonly [TMapLabel, TMapLabel];
		specialGuest: TSpecialGuestId;
		story: { conditionLabel: '全部剧情'; dlc: 5 };
	};
}

type TDecorationSource =
	| IDecorationBondSource
	| IDecorationBondTaskSource
	| IDecorationCollaborationSource
	| IDecorationCompletionSource;

export interface IDecoration extends IItemBase {
	effect: string;
	from: TDecorationSource;
}
