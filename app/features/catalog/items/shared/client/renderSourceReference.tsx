import { Fragment } from 'react';

import { getSchedulerSpecialGuestBonds } from '@/domain/data/labels/schedulerFacts';

import {
	type TSourceReference,
	formatSourceReference,
} from '@/features/catalog/items/shared/sourceReferenceFormatting';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';

export function renderSourceReference(reference: TSourceReference) {
	if (typeof reference !== 'string' && 'task' in reference) {
		const bonds = getSchedulerSpecialGuestBonds(reference.task);
		if (bonds !== null) {
			return bonds.map(({ level, specialGuest }, index) => (
				<Fragment key={`${specialGuest}:${level}`}>
					{index > 0 && '、'}
					<SpecialGuestBondReference
						level={level}
						specialGuest={specialGuest}
					/>
				</Fragment>
			));
		}
	}

	return formatSourceReference(reference);
}
