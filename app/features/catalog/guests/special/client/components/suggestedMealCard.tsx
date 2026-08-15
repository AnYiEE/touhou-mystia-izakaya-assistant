import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Divider } from '@heroui/divider';
import { Select, SelectItem } from '@heroui/select';
import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useMemo, useState } from 'react';

import Avatar from '@/design/ui/components/avatar';
import Button from '@/design/ui/components/button';
import Card from '@/design/ui/components/card';
import FadeMotionDiv, {
	type IFadeMotionDivProps,
} from '@/design/ui/components/fadeMotionDiv';
import Ol from '@/design/ui/components/ol';
import Placeholder from '@/design/ui/components/placeholder';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import { GUEST_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { Plus } from '@/features/catalog/guests/shared/client/components/resultCardAtoms';
import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { useSuggestedMealsViewModel } from '@/features/catalog/guests/special/client/useSuggestedMealsViewModel';
import {
	BEVERAGE_TAG_STYLE,
	FOOD_TAG_STYLE,
} from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import {
	SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP,
	SUGGESTED_MEAL_STATUS_MESSAGE_MAP,
} from './suggestedMealCopy';

const REFRESHING_NOTICE_DELAY_MS = 160;
const STATUS_NOTICE_TRANSITION_DURATION_SECONDS = 0.14;
const STATUS_NOTICE_ANIMATE = { height: 'auto', opacity: 1 } as const;
const STATUS_NOTICE_HIDDEN = { height: 0, opacity: 0 } as const;
const RATING_AVATAR_CLASS_NAMES = { base: 'h-5 w-44 ring-offset-0' } as const;

function useDeferredRefreshingNotice(isRefreshing: boolean) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (!isRefreshing) {
			setIsVisible(false);
			return;
		}

		const timeoutId = setTimeout(() => {
			setIsVisible(true);
		}, REFRESHING_NOTICE_DELAY_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isRefreshing]);

	return isVisible;
}

export default function SuggestedMealCard() {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();
	const {
		availableFoodCookers,
		currentBeverage,
		currentFood,
		currentGuestName,
		currentGuestOrder,
		handleCookerChange,
		handleMaxExtraChange,
		handleMaxRatingChange,
		hasUnsetPopularOrderTag,
		isHighAppearance,
		isVisible,
		selectableMaxExtraIngredients,
		selectableMaxRatings,
		selectedCookerKeys,
		selectedMaxExtraKeys,
		selectedMaxRatingKeys,
		suggestMaxRating,
		suggestedMealRows,
		suggestionStatus,
	} = useSuggestedMealsViewModel();
	const isRefreshingNoticeVisible = useDeferredRefreshingNotice(
		suggestionStatus === 'refreshing'
	);
	const selectClassNames = useMemo(
		() => ({
			listboxWrapper:
				'[&_li]:transition-background focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
			popoverContent: cn({
				'bg-content1/70 backdrop-blur-lg': isHighAppearance,
			}),
			trigger: cn(
				'h-6 min-h-6 bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
				{ 'backdrop-blur': isHighAppearance }
			),
			value: '!text-default-700',
		}),
		[isHighAppearance]
	);
	const selectPopoverProps = useMemo(
		() => ({ motionProps: popoverMotionProps, shouldCloseOnScroll: false }),
		[popoverMotionProps]
	);
	const cookerSelectClassNames = useMemo(
		() => ({ base: 'min-w-[116px]', ...selectClassNames }),
		[selectClassNames]
	);
	const maxRatingSelectClassNames = useMemo(
		() => ({ base: 'min-w-28', ...selectClassNames }),
		[selectClassNames]
	);
	const maxExtraSelectClassNames = useMemo(
		() => ({ base: 'min-w-20', ...selectClassNames }),
		[selectClassNames]
	);
	const cardClassNames = useMemo(
		() => ({
			base: cn({ 'bg-content1/40 backdrop-blur': isHighAppearance }),
		}),
		[isHighAppearance]
	);
	const statusNoticeTransition = useMemo(
		() => ({
			duration: isReducedMotion
				? 0
				: STATUS_NOTICE_TRANSITION_DURATION_SECONDS,
			ease: 'easeInOut' as const,
		}),
		[isReducedMotion]
	);

	let content: IFadeMotionDivProps['children'];
	let contentTarget: IFadeMotionDivProps['target'];

	if (isVisible && currentGuestName !== null) {
		const maxRatingLabel =
			selectableMaxRatings.find((item) => item.value === suggestMaxRating)
				?.label ?? '完美';
		const hasSuggestedMealRows =
			suggestedMealRows !== null && !checkLengthEmpty(suggestedMealRows);
		const isResultInteractionDisabled = suggestionStatus !== 'success';
		const statusNotice = isRefreshingNoticeVisible
			? {
					className: 'text-default-500',
					text: SUGGESTED_MEAL_STATUS_MESSAGE_MAP.refreshing,
				}
			: suggestionStatus === 'error' && hasSuggestedMealRows
				? {
						className: 'text-danger-600',
						text: SUGGESTED_MEAL_STATUS_MESSAGE_MAP.refreshFailed,
					}
				: null;

		const cookerSelect = (
			<div className="flex flex-col gap-x-2 md:flex-row md:items-center md:justify-between xl:flex-col xl:items-start xl:justify-start 3xl:flex-row 3xl:items-center 3xl:justify-between">
				<span
					className={cn(
						'inline-flex items-center gap-1 whitespace-nowrap text-small font-medium leading-8 text-default-700',
						currentFood !== null && '-mt-2 xl:mt-0'
					)}
				>
					猜您想要
					<Popover showArrow>
						<PopoverTrigger>
							<span
								role="button"
								tabIndex={0}
								aria-label="推荐说明"
								className="inline-flex cursor-pointer items-center text-default-500 transition-opacity hover:opacity-hover active:opacity-hover"
							>
								<FontAwesomeIcon
									icon={faCircleQuestion}
									size="sm"
								/>
							</span>
						</PopoverTrigger>
						<PopoverContent>
							<div className="max-w-80 space-y-1.5 p-1 text-tiny text-default-700">
								<p className="font-medium">
									根据当前状态自动推荐套餐：
								</p>
								<Ol className="space-y-0.5">
									<Ol.Li>未选料理和酒水：搜索全部组合</Ol.Li>
									<Ol.Li>已选料理：推荐酒水和额外食材</Ol.Li>
									<Ol.Li>已选酒水：推荐料理和额外食材</Ol.Li>
									<Ol.Li>已选料理和酒水：推荐额外食材</Ol.Li>
								</Ol>
								<p className="font-medium">推荐权重方案：</p>
								<Ol className="space-y-0.5">
									<Ol.Li>
										仅展示不超过“{maxRatingLabel}
										”评级的结果，高评分优先
									</Ol.Li>
									<Ol.Li>
										同评分下依次比较内容与路径归属、稀客地区、地图阶段、预算和获取便利度；额外食材还会比较资源成本
									</Ol.Li>
									<Ol.Li>
										首条为完整排序第一名；后续结果保持评级、内容和路径优先，并尽量展示不同料理和酒水
									</Ol.Li>
									<Ol.Li>
										可限制套餐的额外食材数量，超出上限的套餐将被排除
									</Ol.Li>
									<Ol.Li>
										超出顾客预算偏好的套餐会被降权，超出预算上限的将被排除
									</Ol.Li>
								</Ol>
								<p>
									自动推荐会搜索已启用数据集中的非钓鱼候选，并优先当前稀客所属内容；已在“设置”页面中选择隐藏的项目不会出现。
								</p>
								<p>
									结果受“流行趋势”和“明星店”效果影响，点击额外食材图标可查看可替换食材。
								</p>
								<p className="font-medium text-danger-700">
									此处调整的筛选条件仅在当前页面生效，如需永久保存请前往“设置”页面。
								</p>
							</div>
						</PopoverContent>
					</Popover>
				</span>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-default-700 md:flex-nowrap xl:flex-wrap 2xl:flex-nowrap">
					{currentFood === null && (
						<label className="flex shrink-0 items-center gap-2">
							<span className="cursor-auto whitespace-nowrap">
								厨具
							</span>
							<Select
								disableAnimation={isReducedMotion}
								isVirtualized={false}
								items={availableFoodCookers}
								placeholder="全部"
								selectedKeys={selectedCookerKeys}
								size="sm"
								variant="flat"
								onSelectionChange={handleCookerChange}
								aria-label="选择推荐套餐使用的厨具"
								title="选择推荐套餐使用的厨具"
								popoverProps={selectPopoverProps}
								classNames={cookerSelectClassNames}
							>
								{({ id, name }) => (
									<SelectItem
										key={id.toString()}
										textValue={name}
									>
										<div className="flex items-center">
											<Sprite
												target="cooker"
												recordId={id}
												size={1}
											/>
											<span className="ml-1">{name}</span>
										</div>
									</SelectItem>
								)}
							</Select>
						</label>
					)}
					<label className="flex shrink-0 items-center gap-2">
						<span className="cursor-auto whitespace-nowrap">
							评级上限
						</span>
						<Select
							disallowEmptySelection
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={selectableMaxRatings}
							selectedKeys={selectedMaxRatingKeys}
							size="sm"
							variant="flat"
							onSelectionChange={handleMaxRatingChange}
							aria-label="选择推荐套餐的最高评级"
							title="选择推荐套餐的最高评级"
							popoverProps={selectPopoverProps}
							classNames={maxRatingSelectClassNames}
						>
							{({ label, value }) => (
								<SelectItem
									key={value.toString()}
									textValue={label}
								>
									{label}
								</SelectItem>
							)}
						</Select>
					</label>
					<label className="flex shrink-0 items-center gap-2">
						<span className="cursor-auto whitespace-nowrap">
							加料上限
						</span>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={selectableMaxExtraIngredients}
							placeholder="不限"
							selectedKeys={selectedMaxExtraKeys}
							size="sm"
							variant="flat"
							onSelectionChange={handleMaxExtraChange}
							aria-label="选择推荐套餐的额外食材上限"
							title="选择推荐套餐的额外食材上限"
							popoverProps={selectPopoverProps}
							classNames={maxExtraSelectClassNames}
						>
							{({ label, value }) => (
								<SelectItem
									key={value === null ? '' : value.toString()}
									textValue={label}
								>
									{label}
								</SelectItem>
							)}
						</Select>
					</label>
				</div>
			</div>
		);

		content = (
			<Card fullWidth shadow="sm" classNames={cardClassNames}>
				<div className="space-y-3 p-4 xl:p-2 xl:pb-4">
					{cookerSelect}
					<AnimatePresence initial={false}>
						{statusNotice !== null && (
							<motion.div
								key="suggestion-status-notice"
								animate={STATUS_NOTICE_ANIMATE}
								exit={STATUS_NOTICE_HIDDEN}
								initial={STATUS_NOTICE_HIDDEN}
								transition={statusNoticeTransition}
								className="!mt-0 overflow-hidden"
							>
								<p
									className={cn(
										'pt-3 text-tiny',
										statusNotice.className
									)}
									aria-live="polite"
								>
									{statusNotice.text}
								</p>
							</motion.div>
						)}
					</AnimatePresence>
					<Divider className="md:hidden" />
					{hasUnsetPopularOrderTag ? (
						<Placeholder className="space-y-2 py-4">
							<p>
								{
									SUGGESTED_MEAL_STATUS_MESSAGE_MAP.popularTrendUnset
								}
							</p>
							<p>
								{
									SUGGESTED_MEAL_STATUS_MESSAGE_MAP.popularTrendRequired
								}
							</p>
						</Placeholder>
					) : suggestionStatus === 'pending' ? (
						<Placeholder className="py-4">
							{SUGGESTED_MEAL_STATUS_MESSAGE_MAP.loading}
						</Placeholder>
					) : hasSuggestedMealRows ? (
						suggestedMealRows.map(
							(
								{
									alternativesStatus,
									beverage,
									cooker,
									ensureAlternatives,
									extraIngredients,
									food,
									getAlternatives,
									hasAlternativesLoaded,
									ingredients,
									key,
									meal,
									price,
									ratingKey,
									visibleExtraIngredients,
								},
								loopIndex
							) => {
								const rating = GUEST_RATING_MAP[ratingKey];
								const beverageLabel = `点击：在新窗口中查看酒水【${beverage.name}】的详情`;
								const cookerLabel = `点击：在新窗口中查看厨具【${cooker.name}】的详情`;
								const foodLabel = `点击：在新窗口中查看料理【${food.displayName}】的详情`;
								return (
									<Fragment key={key}>
										<div className="relative flex flex-col items-center gap-4 md:static md:flex-row md:gap-3 lg:gap-4 xl:gap-3">
											<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap md:gap-2 lg:gap-3 xl:gap-2">
												<Popover
													showArrow
													color={ratingKey}
													offset={12}
													placement="left"
												>
													<Tooltip
														showArrow
														color={ratingKey}
														content={rating}
														placement="left"
													>
														<span className="cursor-pointer">
															<PopoverTrigger>
																<Avatar
																	isBordered
																	showFallback
																	color={
																		ratingKey
																	}
																	fallback={
																		<TagGroup className="h-4 flex-nowrap items-center whitespace-nowrap">
																			{price !==
																				0 && (
																				<Tags.Tag
																					tag={
																						<Price>
																							{
																								price
																							}
																						</Price>
																					}
																					className="p-0.5"
																				/>
																			)}
																			{currentGuestOrder.foodTag !==
																				null && (
																				<Tags.Tag
																					tag={
																						FOOD_TAG_MAP[
																							currentGuestOrder
																								.foodTag
																						]
																					}
																					tagStyle={
																						FOOD_TAG_STYLE.positive
																					}
																					className="p-0.5"
																				/>
																			)}
																			{currentGuestOrder.beverageTag !==
																				null && (
																				<Tags.Tag
																					tag={
																						BEVERAGE_TAG_MAP[
																							currentGuestOrder
																								.beverageTag
																						]
																					}
																					tagStyle={
																						BEVERAGE_TAG_STYLE.positive
																					}
																					className="p-0.5"
																				/>
																			)}
																		</TagGroup>
																	}
																	radius="sm"
																	classNames={
																		RATING_AVATAR_CLASS_NAMES
																	}
																/>
															</PopoverTrigger>
														</span>
													</Tooltip>
													<PopoverContent>
														{rating}
													</PopoverContent>
												</Popover>
												<div className="flex items-center gap-2 xl:gap-1">
													<Tooltip
														showArrow
														content={cookerLabel}
														offset={8}
													>
														<Sprite
															target="cooker"
															recordId={cooker.id}
															size={1.5}
															onPress={() => {
																openWindow(
																	'cookers',
																	cooker.id,
																	cooker.name
																);
															}}
															aria-label={
																cookerLabel
															}
															role="button"
														/>
													</Tooltip>
													<Tooltip
														showArrow
														content={foodLabel}
														offset={4}
													>
														<Sprite
															target="food"
															recordId={food.id}
															size={2}
															onPress={() => {
																openWindow(
																	'foods',
																	food.id,
																	food.name
																);
															}}
															aria-label={
																foodLabel
															}
															role="button"
														/>
													</Tooltip>
													<Plus
														size={0.75}
														className="mx-2 md:mx-0 lg:mx-2 xl:mx-0"
													/>
													<Tooltip
														showArrow
														content={beverageLabel}
														offset={4}
													>
														<Sprite
															target="beverage"
															recordId={
																beverage.id
															}
															size={2}
															onPress={() => {
																openWindow(
																	'beverages',
																	beverage.id,
																	beverage.name
																);
															}}
															aria-label={
																beverageLabel
															}
															role="button"
														/>
													</Tooltip>
												</div>
												<Plus
													size={0.75}
													className="md:mx-0 lg:mx-1 xl:mx-0"
												/>
												<div className="flex items-center gap-x-3 md:gap-x-1 lg:gap-x-3 xl:gap-x-1">
													{ingredients.map(
														(
															{ id, name },
															index
														) => {
															const label = `点击：在新窗口中查看食材【${name}】的详情`;
															return (
																<Tooltip
																	key={`${id}-${index}`}
																	showArrow
																	content={
																		label
																	}
																	offset={4}
																>
																	<Sprite
																		target="ingredient"
																		recordId={
																			id
																		}
																		size={2}
																		onPress={() => {
																			openWindow(
																				'ingredients',
																				id,
																				name
																			);
																		}}
																		aria-label={
																			label
																		}
																		role="button"
																	/>
																</Tooltip>
															);
														}
													)}
													{!checkLengthEmpty(
														visibleExtraIngredients
													) && (
														<div className="flex items-center gap-x-3 rounded bg-content2/70 outline outline-2 outline-offset-1 outline-content2 md:gap-x-1 lg:gap-x-3 xl:gap-x-1">
															{visibleExtraIngredients.map(
																(
																	{
																		id,
																		name,
																	},
																	index
																) => {
																	const label = `额外食材【${name}】`;
																	const alternatives =
																		getAlternatives(
																			id
																		);
																	return (
																		<Popover
																			key={`${id}-${index}`}
																			showArrow
																			offset={
																				6
																			}
																			placement="bottom"
																			onOpenChange={(
																				isOpen
																			) => {
																				if (
																					isOpen
																				) {
																					ensureAlternatives();
																				}
																			}}
																		>
																			<Tooltip
																				showArrow
																				content={
																					hasAlternativesLoaded &&
																					checkLengthEmpty(
																						alternatives
																					)
																						? label
																						: `${label}（点击查看可替换食材）`
																				}
																				offset={
																					4
																				}
																			>
																				<span className="flex cursor-pointer">
																					<PopoverTrigger>
																						<Sprite
																							target="ingredient"
																							recordId={
																								id
																							}
																							size={
																								2
																							}
																							role="button"
																						/>
																					</PopoverTrigger>
																				</span>
																			</Tooltip>
																			<PopoverContent>
																				<div className="flex flex-col gap-1 p-1">
																					<span className="text-tiny text-default-700">
																						{alternativesStatus ===
																							'pending' ||
																						alternativesStatus ===
																							'idle'
																							? SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.loading
																							: alternativesStatus ===
																								  'error'
																								? SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.failed
																								: checkLengthEmpty(
																											alternatives
																									  )
																									? SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.empty
																									: SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.ready}
																					</span>
																					{!checkLengthEmpty(
																						alternatives
																					) && (
																						<div
																							className={cn(
																								'flex flex-wrap gap-1'
																							)}
																						>
																							{alternatives.map(
																								({
																									id: alternativeIngredient,
																									name: altName,
																								}) => {
																									const altLabel = `点击：在新窗口中查看食材【${altName}】的详情`;
																									return (
																										<Tooltip
																											key={
																												alternativeIngredient
																											}
																											showArrow
																											content={
																												altLabel
																											}
																											size="sm"
																										>
																											<Sprite
																												target="ingredient"
																												recordId={
																													alternativeIngredient
																												}
																												size={
																													2
																												}
																												onPress={() => {
																													openWindow(
																														'ingredients',
																														alternativeIngredient,
																														altName
																													);
																												}}
																												aria-label={
																													altLabel
																												}
																												role="button"
																											/>
																										</Tooltip>
																									);
																								}
																							)}
																						</div>
																					)}
																				</div>
																			</PopoverContent>
																		</Popover>
																	);
																}
															)}
														</div>
													)}
												</div>
											</div>
											<div className="flex w-full flex-row-reverse items-center justify-center gap-2 md:w-auto xl:flex-col">
												<Button
													fullWidth
													isDisabled={
														isResultInteractionDisabled
													}
													color="primary"
													size="sm"
													variant="flat"
													onPress={() => {
														vibrate();
														if (
															currentFood ===
																null ||
															currentBeverage ===
																null
														) {
															specialGuestStore.shared.beverage.id.set(
																beverage.id
															);
														}
														specialGuestStore.shared.recipe.data.set(
															meal
														);
														trackEvent(
															trackEvent.category
																.click,
															'Select Button',
															`${food.name} - ${beverage.name}${checkLengthEmpty(extraIngredients) ? '' : ` - ${extraIngredients.map(({ name }) => name).join(' ')}`}`
														);
													}}
													className="md:w-auto xl:h-6"
												>
													选择
												</Button>
											</div>
										</div>
										{loopIndex <
											suggestedMealRows.length - 1 && (
											<Divider />
										)}
									</Fragment>
								);
							}
						)
					) : suggestionStatus === 'error' ? (
						<Placeholder className="py-4">
							{SUGGESTED_MEAL_STATUS_MESSAGE_MAP.failed}
						</Placeholder>
					) : (
						<Placeholder className="py-4">
							{SUGGESTED_MEAL_STATUS_MESSAGE_MAP.noMatch}
						</Placeholder>
					)}
				</div>
			</Card>
		);
		contentTarget = 'content';
	} else {
		content = null;
		contentTarget = 'null';
	}

	return <FadeMotionDiv target={contentTarget}>{content}</FadeMotionDiv>;
}
