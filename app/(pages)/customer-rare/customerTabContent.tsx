import {forwardRef, memo, type Dispatch, type DispatchWithoutAction, type SetStateAction} from 'react';
import clsx from 'clsx';

import {Avatar, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {ICurrentCustomer, ICustomerTabState, TCustomerTarget} from './types';
import type {TCustomerInstances} from '@/methods/customer/types';

interface IProps {
	currentCustomer: ICurrentCustomer | null;
	setCurrentCustomer: Dispatch<SetStateAction<IProps['currentCustomer']>>;
	customerTabState: ICustomerTabState;
	toggleCustomerTabState: DispatchWithoutAction;
	refreshCustomer: () => void;
	sortedData: {
		[key in TCustomerTarget]: TCustomerInstances['dataPinyinSorted'];
	};
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerTabContent(
		{currentCustomer, setCurrentCustomer, customerTabState, toggleCustomerTabState, refreshCustomer, sortedData},
		ref
	) {
		return (
			<>
				<ScrollShadow
					hideScrollBar
					className={clsx(
						'transition-[height] xl:h-[calc(100vh-9.75rem)]',
						customerTabState.contentClassName
					)}
					ref={ref}
				>
					<div className="m-2 grid grid-cols-[repeat(auto-fill,4rem)] justify-around gap-4 lg:grid-cols-[repeat(auto-fill,5rem)]">
						{Object.entries(sortedData).map(([target, data]) =>
							data.map(({name}) => (
								<div
									key={name}
									onClick={() => {
										refreshCustomer();
										setCurrentCustomer({name, target: target as TCustomerTarget});
									}}
									className="flex cursor-pointer flex-col items-center gap-1"
								>
									<Avatar
										isBordered
										isFocusable
										color={name === currentCustomer?.name ? 'primary' : 'default'}
										radius="sm"
										icon={<Sprite target={target as TCustomerTarget} name={name} size={5} />}
										classNames={{
											base: 'h-16 w-16 lg:h-20 lg:w-20',
											icon: 'inline-table lg:inline-block',
										}}
									/>
									<span className="break-keep text-xs">{name}</span>
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
						onPress={toggleCustomerTabState}
						className="h-4 w-4/5 text-default-500"
					>
						{customerTabState.buttonNode}
					</Button>
				</div>
			</>
		);
	})
);
