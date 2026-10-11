import { cn } from '@heroui/theme';

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
	const { locale, t } = useI18n(catalogSharedMessages);
	const isEnglish = locale === 'en';

	const specialGuestName = specialGuestCatalog.getDisplayPropsById(
		specialGuest,
		'name'
	);

	return (
		<>
			<span
				className={cn(
					'mr-1',
					isEnglish ? undefined : 'inline-flex items-center'
				)}
			>
				{t('catalog.guestTag.open')}
				<Sprite
					target="special_guest"
					recordId={specialGuest}
					size={size}
					className={cn(
						'mx-0.5 rounded-full',
						isEnglish && 'align-middle'
					)}
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
