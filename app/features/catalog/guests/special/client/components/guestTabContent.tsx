import { cn } from '@heroui/theme';
import { memo, useCallback, useMemo } from 'react';

import Avatar from '@/design/ui/components/avatar';

import { type SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type {
	TSpecialGuestId,
	TSpecialGuestName,
} from '@/domain/data/guests/special/types';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import GuestTabShell from '@/features/catalog/guests/shared/client/components/guestTabShell';
import type { IGuestTabStyle } from '@/features/catalog/guests/shared/contracts';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

interface IProps {
	guestTabStyle: IGuestTabStyle;
	isVisible: boolean;
	sortedData: TItemData<SpecialGuestCatalog>;
}

interface ISpecialGuestAvatarProps {
	id: TSpecialGuestId;
	isSelected: boolean;
	name: TSpecialGuestName;
}

const SpecialGuestAvatar = memo<ISpecialGuestAvatarProps>(
	function SpecialGuestAvatar({ id, isSelected, name }) {
		const classNames = useMemo(
			() => ({
				base: cn(
					'h-16 w-16 ring-default transition-shadow group-hover:ring-warning group-data-[pressed=true]:ring-warning motion-reduce:transition-none lg:h-20 lg:w-20 [&>span]:data-[focus-visible=true]:scale-125',
					{ 'ring-primary': isSelected }
				),
				icon: 'inline-table transition group-hover:scale-125 group-data-[pressed=true]:scale-125 motion-reduce:transition-none lg:inline-block',
			}),
			[isSelected]
		);

		return (
			<Avatar
				isBordered
				isFocusable
				radius="sm"
				icon={
					<Sprite
						target="special_guest"
						recordId={id}
						size={5}
						title={`点击：选择【${name}】`}
					/>
				}
				role="button"
				classNames={classNames}
			/>
		);
	}
);

export default memo<IProps>(function GuestTabContent({
	guestTabStyle,
	isVisible,
	sortedData,
}) {
	const { pushState } = usePathname();
	const vibrate = useVibrate();

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();

	const handleButtonPress = useCallback(() => {
		vibrate();
		specialGuestStore.toggleGuestTabVisibilityState();
	}, [vibrate]);

	const handleGuestSelect = useCallback(
		(id: TSpecialGuestId) => {
			vibrate();
			specialGuestStore.onGuestSelectedChange(id);
			pushState('/special-guests', id.toString());
		},
		[pushState, vibrate]
	);
	const renderAvatar = useCallback(
		(id: TSpecialGuestId, name: TSpecialGuestName) => (
			<SpecialGuestAvatar
				id={id}
				isSelected={id === currentSpecialGuest}
				name={name}
			/>
		),
		[currentSpecialGuest]
	);

	return (
		<GuestTabShell
			currentGuest={currentSpecialGuest}
			guestTabStyle={guestTabStyle}
			isVisible={isVisible}
			onSelect={handleGuestSelect}
			onToggleVisibility={handleButtonPress}
			renderAvatar={renderAvatar}
			sortedData={sortedData}
		/>
	);
});
