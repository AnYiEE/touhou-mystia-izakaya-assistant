import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

import Sprite from './Sprite';

interface IProps {
	level?: number | undefined;
	size?: number;
	specialGuest: TSpecialGuestId;
}

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export default function SpecialGuestBondReference({
	level,
	size = 1.25,
	specialGuest,
}: IProps) {
	const specialGuestName = specialGuestCatalog.getDisplayPropsById(
		specialGuest,
		'name'
	);
	const { t } = useI18n(catalogSharedMessages);

	return (
		<>
			<span className="mr-1 inline-flex items-center">
				{t('catalog.guestTag.open')}
				<Sprite
					target="special_guest"
					recordId={specialGuest}
					size={size}
					className="mx-0.5 rounded-full"
				/>
				{specialGuestName}
				{t('catalog.guestTag.close')}
			</span>
			{t('catalog.specialGuestBond')}
			{level !== undefined && (
				<>
					Lv.{level - 1}
					<span className="mx-0.5">➞</span>
					Lv.{level}
				</>
			)}
		</>
	);
}
