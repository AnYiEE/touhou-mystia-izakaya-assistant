import {memo, useCallback} from 'react';
import {debounce} from 'lodash';

import {useVibrate} from '@/hooks';

import {Avatar, Button, ScrollShadow, cn} from '@nextui-org/react';

import PressElement from '@/components/pressElement';
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
				className={cn(
					'transition-all xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
					customerTabStyle.classNames.content
				)}
			>
				<div className="m-2 grid grid-cols-fill-16 justify-around gap-4 md:grid-cols-fill-20">
					{sortedData.map(({name}, index) => (
						<PressElement
							key={index}
							as="div"
							onPress={() => {
								vibrate();
								customerStore.onCustomerSelectedChange(name);
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
									base: cn(
										'h-20 w-20 scale-90 ring-default transition-shadow hover:ring-warning lg:scale-100',
										{
											'ring-primary': name === currentCustomerName,
										}
									),
									icon: 'block scale-[113%] transition-opacity hover:opacity-hover',
								}}
							/>
						</PressElement>
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
					className={cn('h-4 w-4/5 text-default-300', {
						'backdrop-blur': isHighAppearance,
					})}
				>
					{customerTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
});
