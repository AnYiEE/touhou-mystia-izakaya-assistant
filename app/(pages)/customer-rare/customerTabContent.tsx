import {memo, useCallback} from 'react';
import {debounce} from 'lodash';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICustomerTabStyle} from './types';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {type CustomerRare, checkA11yConfirmKey} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: TItemData<CustomerRare>;
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
				<div className="m-2 grid grid-cols-fill-16 justify-around gap-4 lg:grid-cols-fill-20">
					{sortedData.map(({name}, index) => (
						<div
							key={index}
							onClick={() => {
								vibrate();
								customerStore.onCustomerSelectedChange(name);
							}}
							onKeyDown={checkA11yConfirmKey(() => {
								customerStore.onCustomerSelectedChange(name);
							})}
							title={`点击：选择【${name}】`}
							className="group flex cursor-pointer flex-col items-center gap-1"
						>
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
									base: twMerge(
										'h-16 w-16 ring-default transition-shadow group-hover:ring-warning lg:h-20 lg:w-20',
										name === currentCustomerName && 'ring-primary'
									),
									icon: 'inline-table transition group-hover:scale-125 lg:inline-block',
								}}
							/>
							<span className="whitespace-nowrap text-xs transition-opacity group-hover:opacity-hover">
								{name}
							</span>
						</div>
					))}
				</div>
			</ScrollShadow>
			<div className="flex justify-center xl:hidden">
				<Button
					isIconOnly
					size="sm"
					variant="flat"
					onClick={handleButtonPress}
					onKeyDown={debounce(checkA11yConfirmKey(handleButtonPress))}
					aria-label={customerTabStyle.ariaLabel}
					className={twJoin('h-4 w-4/5 text-default-300', isHighAppearance && 'backdrop-blur')}
				>
					{customerTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
});
