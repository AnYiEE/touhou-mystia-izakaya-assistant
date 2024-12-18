import {Fragment, type PropsWithChildren, memo, useRef} from 'react';
import {isObjectLike} from 'lodash';

import {useOpenedItemPopover, useViewInNewWindow} from '@/hooks';

import {PopoverContent, PopoverTrigger, cn} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {type ICooker, type TCookerCategory} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Cooker} from '@/utils';
import type {TItemData} from '@/utils/types';

interface INameProps {
	category: TCookerCategory;
}

const Name = memo<PropsWithChildren<INameProps>>(function Name({category, children}) {
	if (typeof children !== 'string' || !children.startsWith(category)) {
		return children;
	}

	return (
		<>
			{category}
			<span className="mx-1">⦁</span>
			{children.replace(category, '')}
		</>
	);
});

interface IProps {
	data: TItemData<Cooker>;
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const openWindow = useViewInNewWindow();

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({category, description, dlc, effect, from, id, name, type}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			/** @todo Add it back after {@link https://github.com/nextui-org/nextui/issues/3736} is fixed. */
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={openedPopover ? openedPopover === name : true}
					isPressable={openedPopover ? openedPopover === name : true}
					name={<Name category={category}>{name}</Name>}
					image={
						<Sprite
							target="cooker"
							name={name}
							size={3}
							className={cn({
								'translate-y-px': name.includes('油锅'),
							})}
						/>
					}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Cooker Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="cooker"
					id={id}
					name={name}
					displayName={<Name category={category}>{name}</Name>}
					description={{description, type}}
					dlc={dlc}
					ref={popoverCardRef}
				>
					<p className="break-all text-justify">
						<span className="font-semibold">来源：</span>
						{from.map((item, fromIndex) => (
							<Fragment key={fromIndex}>
								{fromIndex > 0 && '、'}
								{typeof item === 'string'
									? item
									: Object.entries(item).map((itemObject, itemIndex) => {
											type TFrom = Exclude<ICooker['from'][number], string>;
											const [method, target] = itemObject as [keyof TFrom, TFrom[keyof TFrom]];
											const isBond = method === 'bond' && typeof target === 'string';
											const isBuy = method === 'buy' && isObjectLike(target);
											const isSelf = method === 'self';
											return (
												<Fragment key={`${fromIndex}-${itemIndex}`}>
													{isSelf ? (
														'初始拥有'
													) : isBond ? (
														<>
															<span className="mr-1 inline-flex items-center">
																【
																<Sprite
																	target="customer_rare"
																	name={target}
																	size={1.25}
																	className="mx-0.5 rounded-full"
																/>
																{target}】羁绊
															</span>
															Lv.4
															<span className="mx-0.5">➞</span>Lv.5
														</>
													) : (
														isBuy && (
															<>
																{target.name}（
																{target.price.map((priceItem, priceIndex) => (
																	<Fragment
																		key={`${fromIndex}-${itemIndex}-${priceIndex}`}
																	>
																		{priceIndex > 0 && (
																			<span className="mx-1">+</span>
																		)}
																		{typeof priceItem === 'number' ? (
																			<Price>{priceItem}</Price>
																		) : (
																			<span className="inline-flex items-center">
																				<Price showSymbol={false}>
																					{priceItem.amount}×
																				</Price>
																				<Tooltip
																					showArrow
																					content={`点击：在新窗口中查看货币【${priceItem.currency}】的详情`}
																					offset={6}
																					size="sm"
																				>
																					<Sprite
																						target="currency"
																						name={priceItem.currency}
																						size={1.25}
																						onPress={() => {
																							openWindow(
																								'currencies',
																								priceItem.currency
																							);
																						}}
																						aria-label={`点击：在新窗口中查看货币【${priceItem.currency}】的详情`}
																						role="button"
																						tabIndex={0}
																						className="cursor-pointer"
																					/>
																				</Tooltip>
																			</span>
																		)}
																	</Fragment>
																))}
																）
															</>
														)
													)}
												</Fragment>
											);
										})}
							</Fragment>
						))}
					</p>
					{effect !== null && (
						<p className="text-justify">
							<span className="font-semibold">效果：</span>
							{Array.isArray(effect) ? (
								(effect[1] as boolean) ? (
									<Popover showArrow offset={5} size="sm">
										<Tooltip showArrow content="只有米斯蒂娅使用才有此效果" offset={3} size="sm">
											<span className="underline-dotted-offset2 cursor-pointer">
												<PopoverTrigger>
													<span tabIndex={0}>{effect[0]}</span>
												</PopoverTrigger>
											</span>
										</Tooltip>
										<PopoverContent>只有米斯蒂娅使用才有此效果</PopoverContent>
									</Popover>
								) : (
									effect[0]
								)
							) : (
								effect
							)}
						</p>
					)}
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
