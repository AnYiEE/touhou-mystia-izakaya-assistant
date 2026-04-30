import { memo, useCallback } from 'react';

import { usePathname, useVibrate } from '@/hooks';

import { Avatar, cn } from '@/design/ui/components';

import CustomerTabShell from '@/(pages)/customer-shared/customerTabShell';
import Sprite from '@/components/sprite';

import type { ICustomerTabStyle } from '@/(pages)/customer-shared/types';
import { type TCustomerNormalName } from '@/data';
import { customerNormalStore as store } from '@/stores';
import { type CustomerNormal } from '@/utils';
import type { TItemData } from '@/utils/types';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: TItemData<CustomerNormal>;
}

export default memo<IProps>(function CustomerTabContent({
	customerTabStyle,
	sortedData,
}) {
	const { pushState } = usePathname();
	const vibrate = useVibrate();

	const currentCustomerName = store.shared.customer.name.use();

	const handleButtonPress = useCallback(() => {
		vibrate();
		store.toggleCustomerTabVisibilityState();
	}, [vibrate]);

	const handleCustomerSelect = useCallback(
		(name: TCustomerNormalName) => {
			vibrate();
			store.onCustomerSelectedChange(name);
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
			onSelect={handleCustomerSelect}
			onToggleVisibility={handleButtonPress}
			renderAvatar={renderAvatar}
			sortedData={sortedData}
		/>
	);
});
