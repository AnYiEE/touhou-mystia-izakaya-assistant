import { Fragment, memo, useRef } from 'react';

import {
	useItemPopoverState,
	useOpenedItemPopover,
	useViewInNewWindow,
} from '@/hooks';

import {
	CLASSNAME_FOCUS_VISIBLE_OUTLINE,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollShadow,
	Tooltip,
	cn,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Ol from '@/components/ol';
import PressElement from '@/components/pressElement';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {
	COLLECTION_LOCATION_REFRESH_TIME_MAP,
	DLC_LABEL_MAP,
	type IIngredient,
	INGREDIENT_TAG_STYLE,
	type TCollectionLocation,
	type TDlc,
} from '@/data';
import { /* globalStore, */ ingredientsStore } from '@/stores';
import { numberSort, toArray } from '@/utilities';
import { type Ingredient } from '@/utils';
import type { TItemData, TRecipe } from '@/utils/types';

interface IProps {
	data: TItemData<Ingredient>;
}

export default memo<IProps>(function Content({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect } =
		useItemPopoverState(openedPopover);
	const openWindow = useViewInNewWindow();

	// const isHighAppearance = store.persistence.highAppearance.use();

	const hiddenDlcs = ingredientsStore.shared.hiddenItems.dlcs.use();

	const instance = ingredientsStore.instance.get();

	return data.map(
		(
			{ description, dlc, from, id, level, name, price, tags, type },
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
						image={
							<Sprite target="ingredient" name={name} size={3} />
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Ingredient Card',
								name
							);
						}}
					/>
				</ItemPopoverCard.Trigger>
				<ItemPopoverCard.Content>
					<ItemPopoverCard.CloseButton />
					<ItemPopoverCard.ShareButton name={name} />
					<ItemPopoverCard
						target="ingredient"
						id={id}
						name={name}
						description={{ description, level, price, type }}
						dlc={dlc}
						tags={{ positive: tags }}
						tagColors={INGREDIENT_TAG_STYLE}
						ref={popoverCardRef}
					>
						<>
							{(() => {
								const relatedRecipes =
									instance.getRelatedRecipes(name);
								if (relatedRecipes.length === 0) {
									return null;
								}
								const relatedRecipesGroupByDlcMap =
									relatedRecipes.reduce<Map<TDlc, TRecipe[]>>(
										(map, item) => {
											if (hiddenDlcs.has(item.dlc)) {
												return map;
											}
											if (!map.has(item.dlc)) {
												map.set(item.dlc, []);
											}
											(
												map.get(item.dlc) as TRecipe[]
											).push(item);
											return map;
										},
										new Map()
									);
								const relatedRecipesGroupByDlcSorted = toArray(
									relatedRecipesGroupByDlcMap
								).sort(([a], [b]) => numberSort(a, b));
								const label =
									'点击：在新窗口中查看此料理的详情';
								return (
									<p>
										<span className="font-semibold">
											关联料理：
										</span>
										<Popover
											offset={5}
											placement="bottom-start"
											size="sm"
										>
											<PopoverTrigger>
												<span
													role="button"
													tabIndex={0}
													className={cn(
														'underline-dotted-offset2',
														CLASSNAME_FOCUS_VISIBLE_OUTLINE
													)}
												>
													查看包含此食材的料理
												</span>
											</PopoverTrigger>
											<PopoverContent>
												<div className="flex flex-col gap-2 p-2">
													{relatedRecipesGroupByDlcSorted.map(
														(
															[
																relatedDlc,
																recipes,
															],
															dlcIndex
														) => (
															<div key={dlcIndex}>
																<p className="mb-1 text-small font-medium">
																	{
																		DLC_LABEL_MAP[
																			relatedDlc
																		].label
																	}
																</p>
																<div className="grid h-min grid-cols-2 content-start justify-items-start gap-x-4 gap-y-2">
																	{recipes.map(
																		({
																			name: recipeName,
																		}) => (
																			<Tooltip
																				key={
																					recipeName
																				}
																				showArrow
																				closeDelay={
																					0
																				}
																				content={
																					label
																				}
																				offset={
																					1
																				}
																				size="sm"
																			>
																				<PressElement
																					onPress={() => {
																						openWindow(
																							'recipes',
																							recipeName
																						);
																					}}
																					aria-label={
																						label
																					}
																					role="button"
																					tabIndex={
																						0
																					}
																					className={cn(
																						'underline-dotted-offset2 inline-flex cursor-pointer items-center text-tiny',
																						CLASSNAME_FOCUS_VISIBLE_OUTLINE
																					)}
																				>
																					<Sprite
																						target="recipe"
																						name={
																							recipeName
																						}
																						size={
																							1
																						}
																						className="mr-0.5"
																					/>
																					{
																						recipeName
																					}
																				</PressElement>
																			</Tooltip>
																		)
																	)}
																</div>
															</div>
														)
													)}
												</div>
											</PopoverContent>
										</Popover>
									</p>
								);
							})()}
							<ScrollShadow
								size={16}
								className="max-h-dvh-safe-half"
							>
								{Object.entries(from).map(
									(fromObject, fromIndex) => {
										type TFrom = Exclude<
											IIngredient['from'],
											string
										>;
										const [method, target] = fromObject as [
											keyof TFrom,
											ExtractCollectionValue<TFrom>,
										];
										const isBuy = method === 'buy';
										const isCollect = method === 'collect';
										const isFishing = method === 'fishing';
										const isFishingAdvanced =
											method === 'fishingAdvanced';
										const isTask = method === 'task';
										const probability = `概率${isBuy ? '出售' : '掉落'}`;
										const way = isBuy
											? '购买'
											: isFishing
												? '钓鱼'
												: isFishingAdvanced
													? '高级钓鱼'
													: isTask
														? '任务'
														: '采集';
										const label = `${probability}，使用摆件【${isFishing ? '普通的' : '超级'}钓鱼竿】`;
										return (
											<Fragment key={fromIndex}>
												<p
													className={cn(
														'font-semibold',
														{
															'mt-1':
																fromIndex !== 0,
														}
													)}
												>
													{isFishing ||
													isFishingAdvanced ? (
														<Popover
															showArrow
															offset={3}
															size="sm"
														>
															<Tooltip
																showArrow
																content={label}
																offset={1}
																size="sm"
															>
																<span className="inline-flex cursor-pointer">
																	<PopoverTrigger>
																		<span
																			tabIndex={
																				0
																			}
																			className={cn(
																				'underline-dotted-offset2',
																				CLASSNAME_FOCUS_VISIBLE_OUTLINE
																			)}
																		>
																			{
																				way
																			}
																		</span>
																	</PopoverTrigger>
																</span>
															</Tooltip>
															<PopoverContent>
																{label}
															</PopoverContent>
														</Popover>
													) : (
														way
													)}
												</p>
												<Ol className="ml-3">
													{target?.map(
														(item, targetIndex) => (
															<Ol.Li
																key={
																	targetIndex
																}
															>
																{isCollect ||
																Array.isArray(
																	item
																)
																	? (() => {
																			const isArray =
																				Array.isArray(
																					item
																				);
																			const itemProbability =
																				isArray
																					? typeof item[1] ===
																						'number'
																						? `${item[1]}%${probability}`
																						: item[1]
																							? probability
																							: null
																					: null;
																			const collectableTimeRange =
																				isCollect &&
																				isArray &&
																				item.length ===
																					4
																					? ([
																							item[2],
																							item[3],
																						] as [
																							number,
																							number,
																						])
																					: null;
																			const collectableTimeRangeContent =
																				collectableTimeRange ===
																				null ? null : (
																					<>
																						{itemProbability ===
																						null
																							? ''
																							: '；'}
																						采集点出现时间：
																						{
																							collectableTimeRange[0]
																						}
																						<span className="mx-0.5">
																							-
																						</span>
																						{
																							collectableTimeRange[1]
																						}

																						点
																					</>
																				);
																			const refreshTime =
																				isCollect
																					? COLLECTION_LOCATION_REFRESH_TIME_MAP[
																							(isArray
																								? item[0]
																								: item) as TCollectionLocation
																						]
																					: null;
																			const refreshTimeContent =
																				refreshTime ===
																				null ? null : (
																					<>
																						{collectableTimeRange ===
																						null
																							? itemProbability ===
																								null
																								? ''
																								: '；'
																							: '，'}
																						采集点刷新周期：
																						{
																							refreshTime
																						}
																						小时
																					</>
																				);
																			const itemContent =
																				isArray
																					? item[0]
																					: item;
																			const tooltipContent =
																				itemProbability !==
																					null ||
																				collectableTimeRangeContent !==
																					null ||
																				refreshTimeContent !==
																					null ? (
																					<p>
																						{
																							itemProbability
																						}
																						{
																							collectableTimeRangeContent
																						}
																						{
																							refreshTimeContent
																						}
																					</p>
																				) : null;
																			return tooltipContent ===
																				null ? (
																				itemContent
																			) : (
																				<Popover
																					offset={
																						2
																					}
																					size="sm"
																				>
																					<Tooltip
																						content={
																							tooltipContent
																						}
																						closeDelay={
																							0
																						}
																						offset={
																							0
																						}
																						size="sm"
																					>
																						<span className="underline-dotted-offset2 cursor-pointer">
																							<PopoverTrigger>
																								<span
																									tabIndex={
																										0
																									}
																									className={
																										CLASSNAME_FOCUS_VISIBLE_OUTLINE
																									}
																								>
																									{
																										itemContent
																									}
																								</span>
																							</PopoverTrigger>
																						</span>
																					</Tooltip>
																					<PopoverContent>
																						{
																							tooltipContent
																						}
																					</PopoverContent>
																				</Popover>
																			);
																		})()
																	: item}
															</Ol.Li>
														)
													)}
												</Ol>
											</Fragment>
										);
									}
								)}
							</ScrollShadow>
						</>
					</ItemPopoverCard>
				</ItemPopoverCard.Content>
			</ItemPopoverCard.Popover>
		)
	);
});
