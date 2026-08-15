import { cn } from '@heroui/theme';
import { memo, useCallback, useMemo } from 'react';

import Avatar from '@/design/ui/components/avatar';

import { type NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import type {
	TNormalGuestId,
	TNormalGuestName,
} from '@/domain/data/guests/normal/types';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import GuestTabShell from '@/features/catalog/guests/shared/client/components/guestTabShell';
import type { IGuestTabStyle } from '@/features/catalog/guests/shared/contracts';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

interface IProps {
	guestTabStyle: IGuestTabStyle;
	isVisible: boolean;
	sortedData: TItemData<NormalGuestCatalog>;
}

interface INormalGuestAvatarProps {
	id: TNormalGuestId;
	isSelected: boolean;
	name: TNormalGuestName;
}

const NormalGuestAvatar = memo<INormalGuestAvatarProps>(
	function NormalGuestAvatar({ id, isSelected, name }) {
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
					<div className="h-20 w-20 overflow-hidden">
						<Sprite
							target="normal_guest"
							recordId={id}
							size={7.1}
							title={`点击：选择【${name}】`}
							className="-translate-x-4 -translate-y-0.5"
						/>
					</div>
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

	const currentNormalGuest = normalGuestStore.shared.guest.id.use();

	const handleButtonPress = useCallback(() => {
		vibrate();
		normalGuestStore.toggleGuestTabVisibilityState();
	}, [vibrate]);

	const handleGuestSelect = useCallback(
		(id: TNormalGuestId) => {
			vibrate();
			normalGuestStore.onGuestSelectedChange(id);
			pushState('/normal-guests', id.toString());
		},
		[pushState, vibrate]
	);
	const renderAvatar = useCallback(
		(id: TNormalGuestId, name: TNormalGuestName) => (
			<NormalGuestAvatar
				id={id}
				isSelected={id === currentNormalGuest}
				name={name}
			/>
		),
		[currentNormalGuest]
	);

	return (
		<GuestTabShell
			currentGuest={currentNormalGuest}
			guestTabStyle={guestTabStyle}
			isVisible={isVisible}
			onSelect={handleGuestSelect}
			onToggleVisibility={handleButtonPress}
			renderAvatar={renderAvatar}
			sortedData={sortedData}
		/>
	);
});
