import {forwardRef, memo, useCallback} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICurrentCustomer, ICustomerTabStyle} from './types';
import {customerRareStore as customerStore, globalStore} from '@/stores';
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
		const vibrate = useVibrate();

		const currentCustomerData = customerStore.shared.customer.data.use();

		const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

		const handleButtonPress = useCallback(() => {
			vibrate();
			customerStore.toggleCustomerTabVisibilityState();
		}, [vibrate]);

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
										vibrate();
										customerStore.onCustomerSelectedChange({name, target} as ICurrentCustomer);
									}}
									onKeyDown={(event) => {
										if (checkA11yConfirmKey(event)) {
											customerStore.onCustomerSelectedChange({name, target} as ICurrentCustomer);
										}
									}}
									title={`点击：选择【${name}】`}
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
												title={`点击：选择【${name}】`}
											/>
										}
										role="button"
										classNames={{
											base: twMerge(
												'h-16 w-16 ring-default group-hover:ring-warning lg:h-20 lg:w-20',
												name === currentCustomerData?.name && 'ring-primary'
											),
											icon: 'inline-table transition group-hover:scale-125 lg:inline-block',
										}}
									/>
									<span className="whitespace-nowrap text-xs transition-opacity group-hover:opacity-hover">
										{name}
									</span>
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
						onPress={handleButtonPress}
						aria-label={customerTabStyle.ariaLabel}
						className={twJoin('h-4 w-4/5 text-default-300', isShowBackgroundImage && 'backdrop-blur')}
					>
						{customerTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	})
);
