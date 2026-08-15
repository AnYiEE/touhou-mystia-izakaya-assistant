import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TDescription } from '@/domain/data/shared/types';

interface IDecorationBondSource {
	bond: { level: number; specialGuest: TSpecialGuestId };
}

interface IDecorationBondTaskSource extends IDecorationBondSource {
	task: {
		dialogueGuestLabel: '若鹭姬';
		locationLabel: '雾之湖';
		map: 'ScarletMansion';
		task: '内向的人鱼';
	};
}

interface IDecorationCollaborationSource {
	collaboration: { collaborationLabel: '东方华心传' };
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
	effect: TDescription;
	from: TDecorationSource;
}
