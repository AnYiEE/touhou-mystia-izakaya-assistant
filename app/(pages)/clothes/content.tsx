import {Fragment, memo, useRef} from 'react';
import {isObjectLike} from 'lodash';
import {twJoin} from 'tailwind-merge';

import useBreakpoint from 'use-breakpoint';
import {useOpenedItemPopover, useViewInNewWindow} from '@/hooks';

import {PopoverContent, PopoverTrigger} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tachie from '@/components/tachie';
import Tooltip from '@/components/tooltip';

import {type IClothes} from '@/data';
import {clothesStore /* , globalStore */} from '@/stores';
import {type Clothes, checkA11yConfirmKey} from '@/utils';

interface IProps {
	data: Clothes['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
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
		<Popover
			key={dataIndex}
			showArrow
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={openedPopover ? openedPopover === name : true}
					isPressable={openedPopover ? openedPopover === name : true}
					name={name}
					image={
						<Sprite
							target="clothes"
							name={name}
							size={3}
							className={twJoin(
								name === '夜雀服' && '-translate-x-0.5 scale-85',
								name === '雀酒屋工作装' && 'scale-90',
								(name === '中华风校服' ||
									name === '锦绣中国娃娃' ||
									name === '圣诞节特典晚装' ||
									name === '魔女服' ||
									name === '仙女服') &&
									'translate-x-px',
								(name === '魔女服' || name === '冬季水手服') && 'translate-y-px'
							)}
						/>
					}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Clothes Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
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
											const isBuy = method === 'buy' && isObjectLike(target) && 'price' in target;
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
																			onClick={() => {
																				openWindow(
																					'currencies',
																					target.price.currency
																				);
																			}}
																			onKeyDown={(event) => {
																				if (checkA11yConfirmKey(event)) {
																					openWindow(
																						'currencies',
																						target.price.currency
																					);
																				}
																			}}
																			aria-label={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																			role="button"
																			tabIndex={0}
																			className="cursor-pointer"
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
						{(() => {
							const tachie = <Tachie alt={name} src={instance.getTachiePath(name)} width={240} />;
							return (
								<Popover placement={placement} showArrow={placement === 'top'}>
									<PopoverTrigger>
										<span role="button" tabIndex={0} className="underline-dotted-offset2">
											查看立绘
										</span>
									</PopoverTrigger>
									<PopoverContent>{tachie}</PopoverContent>
								</Popover>
							);
						})()}
					</p>
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
