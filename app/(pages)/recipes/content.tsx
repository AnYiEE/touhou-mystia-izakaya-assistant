import { Fragment, memo, useRef } from 'react';
import { isObject } from 'lodash';

import {
	useItemPopoverState,
	useOpenedItemPopover,
	useViewInNewWindow,
} from '@/hooks';

import { t, tUI, tUIf } from '@/i18n';

import {
	CLASSNAME_FOCUS_VISIBLE_OUTLINE,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import { DARK_MATTER_META_MAP, type IRecipe, RECIPE_TAG_STYLE } from '@/data';
// import {globalStore as store} from '@/stores';
import { checkObjectOrStringEmpty } from '@/utilities';
import { type Recipe } from '@/utils';
import type { TItemData } from '@/utils/types';

interface IProps {
	data: TItemData<Recipe>;
}

export default memo<IProps>(function Content({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect } =
		useItemPopoverState(openedPopover);
	const openWindow = useViewInNewWindow();

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(
		(
			{
				cookTime,
				cooker,
				description,
				dlc,
				from,
				id,
				ingredients,
				level,
				name,
				negativeTags,
				positiveTags,
				price,
				recipeId,
			},
			dataIndex
		) => (
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
						description={<Price>{price}</Price>}
						image={<Sprite target="recipe" name={name} size={3} />}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Recipe Card',
								name
							);
						}}
					/>
				</ItemPopoverCard.Trigger>
				<ItemPopoverCard.Content>
					<ItemPopoverCard.CloseButton />
					<ItemPopoverCard.ShareButton name={name} />
					<ItemPopoverCard
						target="recipe"
						id={id}
						recipeId={recipeId}
						name={name}
						description={{ description, level, price }}
						dlc={dlc}
						cooker={
							name === DARK_MATTER_META_MAP.name ? null : cooker
						}
						ingredients={ingredients}
						tags={{
							negative: negativeTags,
							positive: positiveTags,
						}}
						tagColors={RECIPE_TAG_STYLE}
						ref={popoverCardRef}
					>
						{!checkObjectOrStringEmpty(from) && (
							<p className="break-all text-justify">
								<span className="font-semibold">
									{tUI('食谱来源：')}
								</span>
								{typeof from === 'string'
									? from
									: Object.entries(from).map(
											(fromObject, fromIndex) => {
												type TFrom = Exclude<
													IRecipe['from'],
													string
												>;
												const [method, target] =
													fromObject as [
														keyof TFrom,
														ExtractCollectionValue<TFrom>,
													];
												const isBond =
													method === 'bond' &&
													isObject(target) &&
													'level' in target;
												const isBuy =
													method === 'buy' &&
													isObject(target) &&
													'price' in target;
												const isLevelUp =
													method === 'levelup' &&
													Array.isArray(target);
												const isSelf =
													method === 'self';
												return (
													<Fragment key={fromIndex}>
														{isSelf ? (
														tUI('初始拥有')
														) : isBond ? (
															<>
																<span className="mr-1 inline-flex items-center">
																	【
																	<Sprite
																		target="customer_rare"
																		name={
																			target.name
																		}
																		size={
																			1.25
																		}
																		className="mx-0.5 rounded-full"
																	/>
																	{
																		t(target.name)
																	}
																	{tUI('】羁绊')}
																</span>
																Lv.
																{target.level -
																	1}
																<span className="mx-0.5">
																	➞
																</span>
																Lv.
																{target.level}
															</>
														) : isBuy ? (
															<>
																{target.name}（
																{isObject(
																	target.price
																) ? (
																	<span className="inline-flex items-center">
																		<Price
																			showSymbol={
																				false
																			}
																		>
																			{
																				target
																					.price
																					.amount
																			}
																			×
																		</Price>
																		<Tooltip
																			showArrow
																			content={tUIf('点击：在新窗口中查看货币【{currency}】的详情', { currency: t(target.price.currency) })}
																			offset={
																				1
																			}
																			size="sm"
																		>
																			<Sprite
																				target="currency"
																				name={
																					target
																						.price
																						.currency
																				}
																				size={
																					1.25
																				}
																				onPress={() => {
																					if (
																						isObject(
																							target.price
																						)
																					) {
																						openWindow(
																							'currencies',
																							target
																								.price
																								.currency
																						);
																					}
																				}}
																				aria-label={tUIf('点击：在新窗口中查看货币【{currency}】的详情', { currency: t(target.price.currency) })}
																				role="button"
																			/>
																		</Tooltip>
																	</span>
																) : (
																	<Price>
																		{
																			target.price
																		}
																	</Price>
																)}
																）
															</>
														) : (
															isLevelUp && (
																<>
																	<span className="mr-1">
																		{tUI('游戏等级')}
																	</span>
																	Lv.
																	{target[0] -
																		1}
																	<span className="mx-0.5">
																		➞
																	</span>
																	Lv.
																	{target[0]}
																	{target[1] !==
																		null && (
																		<span className="ml-0.5">
																			{tUIf('且已解锁地区【{region}】', { region: t(target[1] as string) })}
																		</span>
																	)}
																</>
															)
														)}
													</Fragment>
												);
											}
										)}
							</p>
						)}
						{cookTime.min !== 0 && (
							<p>
								<Popover showArrow offset={3} size="sm">
									<Tooltip
										showArrow
										content={tUI('随游戏等级提升而降低')}
										offset={1}
										size="sm"
									>
										<span
											className={cn(
												'inline-flex cursor-pointer'
											)}
										>
											<PopoverTrigger>
												<span
													tabIndex={0}
													className={cn(
														'font-semibold',
														CLASSNAME_FOCUS_VISIBLE_OUTLINE
													)}
												>
													<span className="underline-dotted-offset2">
													{tUI('烹饪时间')}
													</span>
													：
												</span>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>
										{tUI('随游戏等级提升而降低')}
									</PopoverContent>
								</Popover>
							{cookTime.max}{tUI('秒')}
							<span className="mx-0.5">➞</span>
							{cookTime.min}{tUI('秒')}
							</p>
						)}
					</ItemPopoverCard>
				</ItemPopoverCard.Content>
			</ItemPopoverCard.Popover>
		)
	);
});
