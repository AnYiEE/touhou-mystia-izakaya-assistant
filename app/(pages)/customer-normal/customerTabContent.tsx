import {forwardRef, memo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICustomerTabStyle} from './types';
import {customerNormalStore as customerStore, globalStore} from '@/stores';
import {type CustomerNormal, checkA11yConfirmKey} from '@/utils';

interface IProps {
	customerTabStyle: ICustomerTabStyle;
	sortedData: CustomerNormal['data'];
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerTabContent({customerTabStyle, sortedData}, ref) {
		const currentCustomerName = customerStore.shared.customer.name.use();

		const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

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
						{sortedData.map(({name}) => (
							<div
								key={name}
								onClick={() => {
									customerStore.onCustomerSelectedChange(name);
								}}
								onKeyDown={(event) => {
									if (checkA11yConfirmKey(event)) {
										customerStore.onCustomerSelectedChange(name);
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
									role="button"
									classNames={{
										base: twMerge(
											'h-20 w-20 scale-90 ring-default hover:ring-warning lg:scale-100',
											name === currentCustomerName && 'ring-primary'
										),
										icon: 'block scale-110 transition-opacity hover:opacity-hover',
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
						onPress={customerStore.toggleCustomerTabVisibilityState}
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
