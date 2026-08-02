import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';

import Avatar from '@/design/ui/components/avatar';

import { type CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import CustomerTabShell from '@/features/catalog/customers/shared/client/components/customerTabShell';
import type { ICustomerTabStyle } from '@/features/catalog/customers/shared/contracts';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	isVisible: boolean;
	sortedData: TItemData<CustomerRare>;
}

export default memo<IProps>(function CustomerTabContent({
	customerTabStyle,
	isVisible,
	sortedData,
}) {
	const { pushState } = usePathname();
	const vibrate = useVibrate();

	const currentCustomerName = customerRareStore.shared.customer.name.use();

	const handleButtonPress = useCallback(() => {
		vibrate();
		customerRareStore.toggleCustomerTabVisibilityState();
	}, [vibrate]);

	const handleCustomerSelect = useCallback(
		(name: TCustomerRareName) => {
			vibrate();
			customerRareStore.onCustomerSelectedChange(name);
			pushState('/customer-rare', name);
		},
		[pushState, vibrate]
	);
	const renderAvatar = useCallback(
		(name: TCustomerRareName) => (
			<Avatar
				isBordered
				isFocusable
				radius="sm"
				icon={
					<Sprite
						target="customer_rare"
						name={name}
						size={5}
						title={`点击：选择【${name}】`}
					/>
				}
				role="button"
				classNames={{
					base: cn(
						'h-16 w-16 ring-default transition-shadow group-hover:ring-warning group-data-[pressed=true]:ring-warning motion-reduce:transition-none lg:h-20 lg:w-20 [&>span]:data-[focus-visible=true]:scale-125',
						{ 'ring-primary': name === currentCustomerName }
					),
					icon: 'inline-table transition group-hover:scale-125 group-data-[pressed=true]:scale-125 motion-reduce:transition-none lg:inline-block',
				}}
			/>
		),
		[currentCustomerName]
	);

	return (
		<CustomerTabShell
			currentCustomerName={currentCustomerName}
			customerTabStyle={customerTabStyle}
			isVisible={isVisible}
			onSelect={handleCustomerSelect}
			onToggleVisibility={handleButtonPress}
			renderAvatar={renderAvatar}
			sortedData={sortedData}
		/>
	);
});
