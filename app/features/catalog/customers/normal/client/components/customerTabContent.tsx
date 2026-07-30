import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';

import Avatar from '@/design/ui/components/avatar';

import { type CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import CustomerTabShell from '@/features/catalog/customers/shared/client/components/customerTabShell';
import type { ICustomerTabStyle } from '@/features/catalog/customers/shared/contracts';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	isVisible: boolean;
	sortedData: TItemData<CustomerNormal>;
}

export default memo<IProps>(function CustomerTabContent({
	customerTabStyle,
	isVisible,
	sortedData,
}) {
	const { pushState } = usePathname();
	const vibrate = useVibrate();

	const currentCustomerName = customerNormalStore.shared.customer.name.use();

	const handleButtonPress = useCallback(() => {
		vibrate();
		customerNormalStore.toggleCustomerTabVisibilityState();
	}, [vibrate]);

	const handleCustomerSelect = useCallback(
		(name: TCustomerNormalName) => {
			vibrate();
			customerNormalStore.onCustomerSelectedChange(name);
			pushState('/customer-normal', name);
		},
		[pushState, vibrate]
	);
	const renderAvatar = useCallback(
		(name: TCustomerNormalName) => (
			<Avatar
				isBordered
				isFocusable
				radius="sm"
				icon={
					<div className="h-20 w-20 overflow-hidden">
						<Sprite
							target="customer_normal"
							name={name}
							size={7.1}
							title={`点击：选择【${name}】`}
							className="-translate-x-4 -translate-y-0.5"
						/>
					</div>
				}
				role="button"
				classNames={{
					base: cn(
						'h-16 w-16 ring-default transition-shadow group-hover:ring-warning motion-reduce:transition-none lg:h-20 lg:w-20 [&>span]:data-[focus-visible=true]:scale-125',
						{ 'ring-primary': name === currentCustomerName }
					),
					icon: 'inline-table transition group-hover:scale-125 motion-reduce:transition-none lg:inline-block',
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
