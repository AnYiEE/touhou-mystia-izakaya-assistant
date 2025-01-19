import {Fragment, memo, useRef} from 'react';
import {isObject} from 'lodash';

import useBreakpoint from 'use-breakpoint';
import {useItemPopoverState, useOpenedItemPopover, useViewInNewWindow} from '@/hooks';

import {
	CLASSNAME_FOCUS_VISIBLE_OUTLINE,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
} from '@/design/ui/components';

import {trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tachie from '@/components/tachie';

import {type IClothes} from '@/data';
import {clothesStore /* , globalStore */} from '@/stores';
import {type Clothes} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	data: TItemData<Clothes>;
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const {checkDefaultOpen, checkShouldEffect} = useItemPopoverState(openedPopover);
	const openWindow = useViewInNewWindow();
	const {breakpoint: placement} = useBreakpoint(
		{
			'right-start': 426,
			top: -1,
		},
		'top'
	);

	// const isHighAppearance = globalStore.persistence.highAppearance.use();

	const instance = clothesStore.instance.get();

	return data.map(({description, dlc, from, id, izakaya, name}, dataIndex) => (
		<ItemPopoverCard.Popover
			key={dataIndex}
			showArrow
			/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={checkDefaultOpen(name)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={checkShouldEffect(name)}
					isPressable={checkShouldEffect(name)}
					name={name}
					image={
						<Sprite
							target="clothes"
							name={name}
							size={3}
							className={cn({
								'-translate-x-0.5 scale-85': name === '夜雀服',
								'scale-90': name === '雀酒屋工作装',
								'translate-x-px':
									name === '中华风校服' ||
									name === '锦绣中国娃娃' ||
									name === '圣诞节特典晚装' ||
									name === '魔女服' ||
									name === '仙女服',
								'translate-y-px': name === '冬季水手服' || name === '魔女服' || name === '朋克演出服',
							})}
						/>
					}
					onPress={() => {
						trackEvent(trackEvent.category.Click, 'Clothes Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<ItemPopoverCard.Content>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="clothes"
					id={id}
					name={name}
					description={{description}}
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
											type TFrom = Exclude<IClothes['from'][number], string>;
											const [method, target] = itemObject as [keyof TFrom, TFrom[keyof TFrom]];
											const isBond = method === 'bond' && typeof target === 'string';
											const isBuy = method === 'buy' && isObject(target) && 'price' in target;
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
																<span className="inline-flex items-center">
																	<Price showSymbol={false}>
																		{target.price.amount}×
																	</Price>
																	<Tooltip
																		showArrow
																		content={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																		offset={6}
																		size="sm"
																	>
																		<Sprite
																			target="currency"
																			name={target.price.currency}
																			size={1.25}
																			onPress={() => {
																				openWindow(
																					'currencies',
																					target.price.currency
																				);
																			}}
																			aria-label={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																			role="button"
																		/>
																	</Tooltip>
																</span>
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
					<p>
						<span className="font-semibold">可选更改店铺装潢：</span>
						{izakaya ? '是' : '否'}
					</p>
					<p>
						<span className="font-semibold">立绘：</span>
						<Popover placement={placement} showArrow={placement === 'top'}>
							<PopoverTrigger>
								<span
									role="button"
									tabIndex={0}
									className={cn('underline-dotted-offset2', CLASSNAME_FOCUS_VISIBLE_OUTLINE)}
								>
									查看立绘
								</span>
							</PopoverTrigger>
							<PopoverContent>
								<Tachie alt={name} src={instance.getTachiePath(name)} width={240} />
							</PopoverContent>
						</Popover>
					</p>
				</ItemPopoverCard>
			</ItemPopoverCard.Content>
		</ItemPopoverCard.Popover>
	));
});
