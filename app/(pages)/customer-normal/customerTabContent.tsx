import {memo, useCallback} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICustomerTabStyle} from './types';
import {customerNormalStore as customerStore, globalStore} from '@/stores';
import {type CustomerNormal, checkA11yConfirmKey} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: TItemData<CustomerNormal>;
}

export default memo<IProps>(function CustomerTabContent({customerTabStyle, sortedData}) {
	const vibrate = useVibrate();

	const currentCustomerName = customerStore.shared.customer.name.use();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const handleButtonPress = useCallback(() => {
		vibrate();
		customerStore.toggleCustomerTabVisibilityState();
	}, [vibrate]);

	return (
		<>
			<ScrollShadow
				hideScrollBar
				className={twMerge(
					'transition-all xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
					customerTabStyle.classNames.content
				)}
			>
				<div className="m-2 grid grid-cols-fill-16 justify-around gap-4 md:grid-cols-fill-20">
					{sortedData.map(({name}, index) => (
						<div
							key={index}
							onClick={() => {
								vibrate();
								customerStore.onCustomerSelectedChange(name);
							}}
							onKeyDown={(event) => {
								if (checkA11yConfirmKey(event)) {
									customerStore.onCustomerSelectedChange(name);
								}
							}}
							title={`点击：选择【${name}】`}
							className="flex cursor-pointer flex-col items-center gap-1"
						>
							<Avatar
								isBordered
								isFocusable
								radius="sm"
								icon={
									<Sprite
										target="customer_normal"
										name={name}
										size={5}
										title={`点击：选择【${name}】`}
									/>
								}
								role="button"
								classNames={{
									base: twMerge(
										'h-20 w-20 scale-90 ring-default transition-shadow hover:ring-warning lg:scale-100',
										name === currentCustomerName && 'ring-primary'
									),
									icon: 'block scale-[113%] transition-opacity hover:opacity-hover',
								}}
							/>
						</div>
					))}
				</div>
			</ScrollShadow>
			<div className="flex justify-center xl:hidden">
				<Button
					isIconOnly
					size="sm"
					variant="flat"
					onPress={handleButtonPress}
					aria-label={customerTabStyle.ariaLabel}
					className={twJoin('h-4 w-4/5 text-default-300', isHighAppearance && 'backdrop-blur')}
				>
					{customerTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
});
