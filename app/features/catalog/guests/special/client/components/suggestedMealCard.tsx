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
		effectiveSortProfileLabel,
		handleCookerChange,
		handleMaxExtraChange,
		handleMaxRatingChange,
		handleMaxResultsChange,
		handleSortProfileChange,
		isHighAppearance,
		isVisible,
		selectableMaxExtraIngredients,
		selectableMaxRatings,
		selectableMaxResults,
		selectedCookerKeys,
		selectedMaxExtraKeys,
		selectedMaxRatingKeys,
		selectedMaxResultKeys,
		selectedSortProfileKeys,
		sortProfileOptions,
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
	const sortProfileSelectClassNames = useMemo(
		() => ({ base: 'min-w-28', ...selectClassNames }),
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
			<div className="flex items-center justify-between gap-2">
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
								<p className="font-medium">会推荐什么：</p>
								<Ol className="space-y-0.5">
									<Ol.Li>
										什么都没选：搭配料理、酒水和额外食材
									</Ol.Li>
									<Ol.Li>
										只选了料理：补上酒水和额外食材
									</Ol.Li>
									<Ol.Li>
										只选了酒水：补上料理和额外食材
									</Ol.Li>
									<Ol.Li>
										料理和酒水都选了：只补额外食材
									</Ol.Li>
								</Ol>
								<p className="font-medium">
									当前策略：{effectiveSortProfileLabel}
								</p>
								<Ol className="space-y-0.5">
									<Ol.Li>
										容易获取：评级相同时，优先当前稀客所属内容和更合适的获取路径
									</Ol.Li>
									<Ol.Li>
										低价优先：评级相同时，套餐总价越低越靠前
									</Ol.Li>
									<Ol.Li>
										高价优先：评级相同时，套餐总价越高越靠前
									</Ol.Li>
									<Ol.Li>
										少料易做：评级相同时，料理本身和额外食材的总成本越低越靠前
									</Ol.Li>
								</Ol>
								<p className="font-medium">筛选和排序：</p>
								<Ol className="space-y-0.5">
									<Ol.Li>
										结果按评级从高到低排列，最高显示到“
										{maxRatingLabel}”
									</Ol.Li>
									<Ol.Li>
										评级相同时，还会参考内容归属、稀客所在地区、地图进度、预算和获取难度；有额外食材时也会计算材料成本
									</Ol.Li>
									<Ol.Li>
										超过加料上限的套餐不会显示。价格略高于预算偏好时会靠后，超过顾客可接受的预算上限后不会显示
									</Ol.Li>
								</Ol>
								<p className="font-medium">结果说明：</p>
								<Ol className="space-y-0.5">
									<Ol.Li>
										容易获取会保留完整排序第一名，后续尽量换用不同的料理和酒水
									</Ol.Li>
									<Ol.Li>
										低价、高价和少料易做会按各自的顺序排列，并过滤重复的料理或酒水，因此结果可能少于设置的条数
									</Ol.Li>
									<Ol.Li>
										只使用已启用且未隐藏的非钓鱼项目，并优先选择当前稀客所属内容
									</Ol.Li>
									<Ol.Li>
										推荐结果会受“流行趋势”和“明星店”效果影响
									</Ol.Li>
									<Ol.Li>
										没指定酒水时，点击推荐酒水可查看可替换酒水；点击额外食材可查看可替换食材
									</Ol.Li>
								</Ol>
								<p className="font-medium text-danger-700">
									厨具和推荐策略只在当前浏览器标签页生效。选择“跟随全局设置”后，这里会使用默认推荐策略；评级、加料上限和推荐条数会保存到全局设置。
								</p>
							</div>
						</PopoverContent>
					</Popover>
				</span>
				<Popover
					shouldBlockScroll
					placement="bottom-end"
					shouldCloseOnScroll={false}
				>
					<PopoverTrigger>
						<Button
							size="sm"
							variant="flat"
							aria-label="打开“猜您想要”推荐设置"
							className="h-6 min-h-6"
							title="打开“猜您想要”推荐设置"
						>
							推荐设置
						</Button>
					</PopoverTrigger>
					<PopoverContent className="max-h-[calc(100dvh-2rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto px-3.5 py-2">
						<div className="w-full space-y-3 text-default-700">
							<p className="text-tiny">
								厨具和推荐策略仅在当前标签页生效；修改评级、加料上限或推荐条数会保存到全局设置。
							</p>
							{currentFood === null && (
								<label className="block space-y-1">
									<span className="block cursor-auto px-1 text-tiny font-medium">
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
													<span className="ml-1">
														{name}
													</span>
												</div>
											</SelectItem>
										)}
									</Select>
								</label>
							)}
							<label className="block space-y-1">
								<span className="block cursor-auto px-1 text-tiny font-medium">
									推荐策略
								</span>
								<Select
									disallowEmptySelection
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={sortProfileOptions}
									selectedKeys={selectedSortProfileKeys}
									selectionMode="single"
									size="sm"
									variant="flat"
									onSelectionChange={handleSortProfileChange}
									aria-label="选择猜您想要推荐策略；跟随全局设置时实时使用默认推荐策略"
									title="选择猜您想要推荐策略；跟随全局设置时实时使用默认推荐策略"
									popoverProps={selectPopoverProps}
									classNames={sortProfileSelectClassNames}
								>
									{({ label, value }) => (
										<SelectItem
											key={value}
											textValue={label}
										>
											{label}
										</SelectItem>
									)}
								</Select>
							</label>
							<label className="block space-y-1">
								<span className="block cursor-auto px-1 text-tiny font-medium">
									推荐条数
								</span>
								<Select
									disallowEmptySelection
									disableAnimation={isReducedMotion}
									isVirtualized={false}
									items={selectableMaxResults}
									selectedKeys={selectedMaxResultKeys}
									size="sm"
									variant="flat"
									onSelectionChange={handleMaxResultsChange}
									aria-label="选择推荐套餐的推荐条数；修改后会保存到全局设置"
									title="选择推荐套餐的推荐条数；修改后会保存到全局设置"
									popoverProps={selectPopoverProps}
									classNames={maxExtraSelectClassNames}
								>
									{({ value }) => (
										<SelectItem
											key={value.toString()}
											textValue={value.toString()}
										>
											{value}
										</SelectItem>
									)}
								</Select>
							</label>
							<label className="block space-y-1">
								<span className="block cursor-auto px-1 text-tiny font-medium">
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
							<label className="block space-y-1">
								<span className="block cursor-auto px-1 text-tiny font-medium">
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
											key={
												value === null
													? ''
													: value.toString()
											}
											textValue={label}
										>
											{label}
										</SelectItem>
									)}
								</Select>
							</label>
						</div>
					</PopoverContent>
				</Popover>
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
					{suggestionStatus === 'pending' ? (
						<Placeholder className="py-4">
							{SUGGESTED_MEAL_STATUS_MESSAGE_MAP.loading}
						</Placeholder>
					) : hasSuggestedMealRows ? (
						suggestedMealRows.map(
							(
								{
									alternativesStatus,
									beverage,
									beverageAlternatives,
									beverageAlternativesStatus,
									cooker,
									ensureAlternatives,
									ensureBeverageAlternatives,
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
								const beverageDetailsLabel = `点击：在新窗口中查看酒水【${beverage.name}】的详情`;
								const beverageAlternativesLabel = `酒水【${beverage.name}】（点击查看可替换酒水）`;
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
													{currentBeverage === null &&
													suggestionStatus ===
														'success' ? (
														<Popover
															showArrow
															offset={6}
															placement="bottom"
															onOpenChange={(
																isOpen
															) => {
																if (isOpen) {
																	ensureBeverageAlternatives();
																}
															}}
														>
															<Tooltip
																showArrow
																content={
																	beverageAlternativesLabel
																}
																offset={4}
															>
																<span className="flex cursor-pointer">
																	<PopoverTrigger>
																		<Sprite
																			target="beverage"
																			recordId={
																				beverage.id
																			}
																			size={
																				2
																			}
																			aria-label={
																				beverageAlternativesLabel
																			}
																			role="button"
																		/>
																	</PopoverTrigger>
																</span>
															</Tooltip>
															<PopoverContent>
																<div className="flex max-w-64 flex-col gap-1 p-1">
																	<div className="flex items-center justify-between gap-2">
																		<span
																			role="status"
																			aria-live="polite"
																			className="text-tiny text-default-700"
																		>
																			{beverageAlternativesStatus ===
																				'pending' ||
																			beverageAlternativesStatus ===
																				'idle'
																				? SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.loading
																				: beverageAlternativesStatus ===
																					  'error'
																					? SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.failed
																					: checkLengthEmpty(
																								beverageAlternatives
																						  )
																						? SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.empty
																						: SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP.ready}
																		</span>
																		<Tooltip
																			showArrow
																			content={
																				beverageDetailsLabel
																			}
																			size="sm"
																		>
																			<Button
																				size="sm"
																				variant="flat"
																				onPress={() => {
																					openWindow(
																						'beverages',
																						beverage.id,
																						beverage.name
																					);
																				}}
																				aria-label={
																					beverageDetailsLabel
																				}
																				className="h-6 min-h-6 px-2 text-tiny"
																			>
																				原酒水详情
																			</Button>
																		</Tooltip>
																	</div>
																	{!checkLengthEmpty(
																		beverageAlternatives
																	) && (
																		<div className="flex max-h-48 flex-wrap gap-1 overflow-y-auto">
																			{beverageAlternatives.map(
																				({
																					id: alternativeBeverage,
																					name: alternativeName,
																					price: alternativePrice,
																				}) => {
																					const priceDifference =
																						alternativePrice -
																						price;
																					const alternativeLabel = `点击：在新窗口中查看酒水【${alternativeName}】\u2005的详情；套餐价格由¥${price}变为¥${alternativePrice}`;
																					return (
																						<Tooltip
																							key={
																								alternativeBeverage
																							}
																							showArrow
																							content={
																								<span>
																									{
																										'点击：在新窗口中查看酒水【'
																									}
																									{
																										alternativeName
																									}
																									{
																										'】的详情；套餐价格由\u2005¥'
																									}
																									<Price
																										showSymbol={
																											false
																										}
																									>
																										{
																											price
																										}
																									</Price>
																									{
																										'\u2005变为\u2005¥'
																									}
																									<Price
																										showSymbol={
																											false
																										}
																									>
																										{
																											alternativePrice
																										}
																									</Price>
																								</span>
																							}
																							size="sm"
																						>
																							<span className="flex flex-col items-center gap-0.5 rounded p-0.5">
																								<Sprite
																									target="beverage"
																									recordId={
																										alternativeBeverage
																									}
																									size={
																										2
																									}
																									onPress={() => {
																										openWindow(
																											'beverages',
																											alternativeBeverage,
																											alternativeName
																										);
																									}}
																									aria-label={
																										alternativeLabel
																									}
																									role="button"
																								/>
																								<span
																									className={cn(
																										'text-tiny leading-none',
																										{
																											'text-danger-600':
																												priceDifference >
																												0,
																											'text-default-500':
																												priceDifference ===
																												0,
																											'text-success-600':
																												priceDifference <
																												0,
																										}
																									)}
																								>
																									{priceDifference ===
																									0 ? (
																										'不变'
																									) : (
																										<>
																											{priceDifference >
																											0
																												? '+'
																												: '-'}
																											{
																												'\u2005¥'
																											}
																											<Price
																												showSymbol={
																													false
																												}
																											>
																												{Math.abs(
																													priceDifference
																												)}
																											</Price>
																										</>
																									)}
																								</span>
																							</span>
																						</Tooltip>
																					);
																				}
																			)}
																		</div>
																	)}
																</div>
															</PopoverContent>
														</Popover>
													) : (
														<Tooltip
															showArrow
															content={
																beverageDetailsLabel
															}
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
																	beverageDetailsLabel
																}
																role="button"
															/>
														</Tooltip>
													)}
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
