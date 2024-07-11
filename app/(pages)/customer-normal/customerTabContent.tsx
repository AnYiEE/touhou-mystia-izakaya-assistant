import {forwardRef, memo} from 'react';
import clsx from 'clsx/lite';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICustomerTabStyle} from './types';
import type {TCustomerNormalInstances} from '@/methods/customer/types';
import {useCustomerNormalStore} from '@/stores';
import {checkA11yConfirmKey} from '@/utils';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: TCustomerNormalInstances['data'];
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerTabContent({customerTabStyle, sortedData}, ref) {
		const store = useCustomerNormalStore();

		const currentCustomerName = store.shared.customer.name.use();

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
						{sortedData.map(({name}) => (
							<div
								key={name}
								onClick={() => {
									store.shared.customer.name.set(name);
								}}
								onKeyDown={(event) => {
									if (checkA11yConfirmKey(event)) {
										store.shared.customer.name.set(name);
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
										<Sprite target="customer_normal" name={name} size={5} title={`选择${name}`} />
									}
									classNames={{
										base: clsx(
											'h-20 w-20 scale-90 ring-default hover:ring-warning lg:scale-100',
											name === currentCustomerName && 'ring-primary'
										),
										icon: 'inline-table scale-110 transition-opacity hover:opacity-80 lg:inline-block',
									}}
								/>
							</div>
						))}
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
