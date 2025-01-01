import {memo, useCallback} from 'react';
import {debounce} from 'lodash';

import {useVibrate} from '@/hooks';

import {Avatar, ScrollShadow, cn} from '@nextui-org/react';

import Button from '@/components/button';
import PressElement from '@/components/pressElement';
import Sprite from '@/components/sprite';

import type {ICustomerTabStyle} from './types';
import {customerNormalStore as store} from '@/stores';
import {type CustomerNormal, checkA11yConfirmKey} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: TItemData<CustomerNormal>;
}

export default memo<IProps>(function CustomerTabContent({customerTabStyle, sortedData}) {
	const vibrate = useVibrate();

	const currentCustomerName = store.shared.customer.name.use();

	const handleButtonPress = useCallback(() => {
		vibrate();
		store.toggleCustomerTabVisibilityState();
	}, [vibrate]);

	return (
		<>
			<ScrollShadow
				hideScrollBar
				className={cn(
					'transition-all xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
					customerTabStyle.classNames.content
				)}
			>
				<div className="m-2 grid grid-cols-fill-16 justify-around gap-4 lg:grid-cols-fill-20">
					{sortedData.map(({name}, index) => (
						<PressElement
							key={index}
							as="div"
							onPress={() => {
								vibrate();
								store.onCustomerSelectedChange(name);
							}}
							title={`点击：选择【${name}】`}
							className="group flex cursor-pointer flex-col items-center gap-1"
						>
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
										'h-16 w-16 ring-default transition-shadow group-hover:ring-warning lg:h-20 lg:w-20 [&>span]:data-[focus-visible=true]:scale-125',
										{
											'ring-primary': name === currentCustomerName,
										}
									),
									icon: 'inline-table transition group-hover:scale-125 lg:inline-block',
								}}
							/>
							<span className="whitespace-nowrap text-tiny transition-opacity group-hover:opacity-hover">
								{name}
							</span>
						</PressElement>
					))}
				</div>
			</ScrollShadow>
			<div className="flex justify-center xl:hidden">
				<Button
					highAppearance
					isIconOnly
					size="sm"
					variant="flat"
					onClick={handleButtonPress}
					onKeyDown={debounce(checkA11yConfirmKey(handleButtonPress))}
					aria-label={customerTabStyle.ariaLabel}
					className="h-4 w-4/5 text-default-300"
				>
					{customerTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
});
