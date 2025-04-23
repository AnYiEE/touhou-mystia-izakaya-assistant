import {memo, useCallback} from 'react';
import {debounce} from 'lodash';

import {useVibrate} from '@/hooks';

import {Avatar, Button, ScrollShadow, cn} from '@/design/ui/components';

import PressElement from '@/components/pressElement';
import Sprite from '@/components/sprite';

import type {ICustomerTabStyle} from './types';
import {customerNormalStore as store} from '@/stores';
import {checkA11yConfirmKey} from '@/utilities';
import {type CustomerNormal} from '@/utils';
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
				className={cn(
					'transition-all motion-reduce:transition-none xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
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
										'h-16 w-16 ring-default transition-shadow group-hover:ring-warning motion-reduce:transition-none lg:h-20 lg:w-20 [&>span]:data-[focus-visible=true]:scale-125',
										{
											'ring-primary': name === currentCustomerName,
										}
									),
									icon: 'inline-table transition group-hover:scale-125 motion-reduce:transition-none lg:inline-block',
								}}
							/>
							<span className="whitespace-nowrap text-tiny text-default-800 transition-colors group-hover:text-default-900 motion-reduce:transition-none">
								{name}
							</span>
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
					className="h-4 w-4/5 text-default-400"
				>
					{customerTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
});
