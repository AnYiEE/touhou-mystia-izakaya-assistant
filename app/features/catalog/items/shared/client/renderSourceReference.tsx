import { Fragment } from 'react';

import { getSchedulerSpecialGuestBonds } from '@/domain/data/labels/schedulerFacts';

import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import {
	type TSourceReference,
	formatSourceReference,
} from '@/features/catalog/items/shared/sourceReferenceFormatting';
import SpecialGuestBondReference from '@/features/catalog/shared/client/components/SpecialGuestBondReference';

import { type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';

export function renderSourceReference(
	reference: TSourceReference,
	locale: TLocale
) {
	if (typeof reference !== 'string' && 'task' in reference) {
		const bonds = getSchedulerSpecialGuestBonds(reference.task);
		if (bonds !== null) {
			return bonds.map(({ level, specialGuest }, index) => (
				<Fragment key={`${specialGuest}:${level}`}>
					{index > 0 &&
						translate(
							catalogItemsMessages,
							locale,
							'items.source.listSeparator'
						)}
					<SpecialGuestBondReference
						level={level}
						specialGuest={specialGuest}
					/>
				</Fragment>
			));
		}
	}

	return formatSourceReference(reference, locale);
}
