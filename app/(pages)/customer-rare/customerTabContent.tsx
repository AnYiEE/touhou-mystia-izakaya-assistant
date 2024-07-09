import {forwardRef, memo} from 'react';
import clsx from 'clsx';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICustomerTabStyle, TCustomerTarget} from './types';
import type {TCustomerRareInstances, TCustomerSpecialInstances} from '@/methods/customer/types';
import {useCustomerRareStore} from '@/stores';
import {checkA11yConfirmKey} from '@/utils';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: {
		customer_rare: TCustomerRareInstances['data'];
		customer_special: TCustomerSpecialInstances['data'];
	};
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerTabContent({customerTabStyle, sortedData}, ref) {
		const store = useCustomerRareStore();

		const currentCustomer = store.shared.customer.data.use();

		return (
			<>
				<ScrollShadow
					hideScrollBar
					className={clsx(
						'transition-[height] xl:h-[calc(100vh-9.75rem-env(titlebar-area-height,0rem))]',
						customerTabStyle.contentClassName
					)}
					ref={ref}
				>
					<div className="m-2 grid grid-cols-[repeat(auto-fill,4rem)] justify-around gap-4 lg:grid-cols-[repeat(auto-fill,5rem)]">
						{Object.entries(sortedData).map(([target, data]) =>
							data.map(({name}) => (
								<div
									key={name}
									onClick={() => {
										store.shared.customer.data.set({name, target: target as TCustomerTarget});
									}}
									onKeyDown={(event) => {
										if (checkA11yConfirmKey(event)) {
											store.shared.customer.data.set({name, target: target as TCustomerTarget});
										}
									}}
									title={`选择${name}`}
									className="flex cursor-pointer flex-col items-center gap-1"
								>
									<Avatar
										isBordered
										isFocusable
										radius="sm"
										icon={
											<Sprite
												target={target as TCustomerTarget}
												name={name}
												size={5}
												title={`选择${name}`}
											/>
										}
										classNames={{
											base: clsx(
												'h-16 w-16 ring-default hover:ring-warning lg:h-20 lg:w-20',
												name === currentCustomer?.name && 'ring-primary'
											),
											icon: 'inline-table transition hover:scale-125 lg:inline-block',
										}}
									/>
									<span className="text-nowrap break-keep text-xs">{name}</span>
								</div>
							))
						)}
					</div>
				</ScrollShadow>
				<div className="absolute flex w-[99%] justify-center xl:hidden">
					<Button
						isIconOnly
						size="sm"
						variant="flat"
						onPress={store.toggleCustomerTabVisibilityState}
						aria-label={customerTabStyle.ariaLabel}
						className="h-4 w-4/5 text-default-500"
					>
						{customerTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	})
);
