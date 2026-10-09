import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

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
	const specialGuestName = specialGuestCatalog.getPropsById(
		specialGuest,
		'name'
	);

	return (
		<>
			<span className="mr-1 inline-flex items-center">
				【
				<Sprite
					target="special_guest"
					recordId={specialGuest}
					size={size}
					className="mx-0.5 rounded-full"
				/>
				{specialGuestName}】
			</span>
			羁绊
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
