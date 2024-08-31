import {forwardRef, memo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICurrentCustomer, ICustomerTabStyle} from './types';
import {customerRareStore as store} from '@/stores';
import {type CustomerRare, type CustomerSpecial, checkA11yConfirmKey} from '@/utils';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: {
		customer_rare: CustomerRare['data'];
		customer_special: CustomerSpecial['data'];
	};
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerTabContent({customerTabStyle, sortedData}, ref) {
		const currentCustomerData = store.shared.customer.data.use();

		return (
			<>
				<ScrollShadow
					hideScrollBar
					className={twMerge(
						'transition-all xl:max-h-[calc(var(--safe-h-dvh)-9.75rem-env(titlebar-area-height,0rem))]',
						customerTabStyle.classNames.content
					)}
					ref={ref}
				>
					<div className="m-2 grid grid-cols-fill-16 justify-around gap-4 lg:grid-cols-fill-20">
						{Object.entries(sortedData).map(([target, data]) =>
							data.map(({name}) => (
								<div
									key={name}
									onClick={() => {
										store.onCustomerSelectedChange({name, target} as ICurrentCustomer);
									}}
									onKeyDown={(event) => {
										if (checkA11yConfirmKey(event)) {
											store.onCustomerSelectedChange({name, target} as ICurrentCustomer);
										}
									}}
									title={`选择${name}`}
									className="group flex cursor-pointer flex-col items-center gap-1"
								>
									<Avatar
										isBordered
										isFocusable
										radius="sm"
										icon={
											<Sprite
												target={target as ICurrentCustomer['target']}
												name={name}
												size={5}
												title={`选择${name}`}
											/>
										}
										role="button"
										classNames={{
											base: twJoin(
												'h-16 w-16 ring-default group-hover:ring-warning lg:h-20 lg:w-20',
												name === currentCustomerData?.name && 'ring-primary'
											),
											icon: 'inline-table transition group-hover:scale-125 lg:inline-block',
										}}
									/>
									<span className="whitespace-nowrap text-xs group-hover:opacity-80">{name}</span>
								</div>
							))
						)}
					</div>
				</ScrollShadow>
				<div className="flex justify-center xl:hidden">
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
