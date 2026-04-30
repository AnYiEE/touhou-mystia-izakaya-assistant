import { Fragment } from 'react';

import {
	useSuggestedMealsViewModel,
	useVibrate,
	useViewInNewWindow,
} from '@/hooks';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';

import { Divider } from '@heroui/divider';
import { Select, SelectItem } from '@heroui/select';

import {
	Avatar,
	Button,
	Card,
	FadeMotionDiv,
	type IFadeMotionDivProps,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
	useMotionProps,
	useReducedMotion,
} from '@/design/ui/components';

import { Plus } from '@/(pages)/customer-shared/resultCardAtoms';
import TagGroup from '@/(pages)/customer-shared/tagGroup';
import { trackEvent } from '@/components/analytics';
import Ol from '@/components/ol';
import Placeholder from '@/components/placeholder';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {
	BEVERAGE_TAG_STYLE,
	CUSTOMER_RATING_MAP,
	RECIPE_TAG_STYLE,
} from '@/data';
import { customerRareStore as customerStore } from '@/stores';
import { checkLengthEmpty } from '@/utilities';

export default function SuggestedMealCard() {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();
	const {
		availableRecipeCookers,
		currentBeverageName,
		currentCustomerName,
		currentCustomerOrder,
		currentRecipeData,
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
	} = useSuggestedMealsViewModel();

	let content: IFadeMotionDivProps['children'];
	let contentTarget: IFadeMotionDivProps['target'];

	if (isVisible && currentCustomerName !== null) {
		const selectClassNames = {
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
		};

		const maxRatingLabel =
			selectableMaxRatings.find((item) => item.value === suggestMaxRating)
				?.label ?? '完美';

		const cookerSelect = (
			<div className="flex flex-col gap-x-2 md:flex-row md:items-center md:justify-between xl:flex-col xl:items-start xl:justify-start 3xl:flex-row 3xl:items-center 3xl:justify-between">
				<span
					className={cn(
						'inline-flex items-center gap-1 whitespace-nowrap text-small font-medium leading-8 text-default-700',
						currentRecipeData !== null && '-mt-2 xl:mt-0'
					)}
				>
					猜您想要
					<Popover showArrow>
						<PopoverTrigger>
							<span
								role="button"
								tabIndex={0}
								aria-label="推荐说明"
								className="inline-flex cursor-pointer items-center text-default-500 transition-opacity hover:opacity-hover"
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
										同评分下优先推荐获取更便利的料理、酒水和食材
									</Ol.Li>
									<Ol.Li>
										可限制套餐的额外食材数量，超出上限的套餐将被排除
									</Ol.Li>
									<Ol.Li>
										超出顾客预算偏好的套餐会被降权，超出预算上限的将被排除
									</Ol.Li>
								</Ol>
								<p>
									搜索范围仅包含本体和当前稀客所属DLC中的料理、酒水和食材，已在“设置”页面中选择隐藏的项目不会出现。
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
					{currentRecipeData === null && (
						<label className="flex shrink-0 items-center gap-2">
							<span className="cursor-auto whitespace-nowrap">
								厨具
							</span>
							<Select
								disableAnimation={isReducedMotion}
								isVirtualized={false}
								items={availableRecipeCookers}
								placeholder="全部"
								selectedKeys={selectedCookerKeys}
								size="sm"
								variant="flat"
								onSelectionChange={handleCookerChange}
								aria-label="选择推荐套餐使用的厨具"
								title="选择推荐套餐使用的厨具"
								popoverProps={{
									motionProps: popoverMotionProps,
									shouldCloseOnScroll: false,
								}}
								classNames={{
									base: 'min-w-[116px]',
									...selectClassNames,
								}}
							>
								{({ value }) => (
									<SelectItem key={value} textValue={value}>
										<div className="flex items-center">
											<Sprite
												target="cooker"
												name={value}
												size={1}
											/>
											<span className="ml-1">
												{value}
											</span>
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
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: 'min-w-28',
								...selectClassNames,
							}}
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
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: 'min-w-20',
								...selectClassNames,
							}}
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
			<Card
				fullWidth
				shadow="sm"
				classNames={{
					base: cn({
						'bg-content1/40 backdrop-blur': isHighAppearance,
					}),
				}}
			>
				<div className="space-y-3 p-4 xl:p-2 xl:pb-4">
					{cookerSelect}
					<Divider className="md:hidden" />
					{hasUnsetPopularOrderTag ? (
						<Placeholder className="space-y-2 py-4">
							<p>选定的点单需求包含流行趋势标签</p>
							<p>请您先在设置中指定「流行趋势」</p>
						</Placeholder>
					) : suggestedMealRows === null ? (
						<Placeholder className="py-4">
							未找到匹配的推荐套餐
						</Placeholder>
					) : (
						suggestedMealRows.map(
							(
								{
									beverage,
									cooker,
									ensureAlternatives,
									getAlternatives,
									hasAlternativesLoaded,
									key,
									price,
									ratingKey,
									recipeData,
									recipeDisplayName,
									recipeIngredients,
									visibleExtraIngredients,
								},
								loopIndex
							) => {
								const rating = CUSTOMER_RATING_MAP[ratingKey];
								const beverageLabel = `点击：在新窗口中查看酒水【${beverage}】的详情`;
								const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
								const recipeLabel = `点击：在新窗口中查看料理【${recipeDisplayName}】的详情`;
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
																					tagStyle={{}}
																					className="p-0.5"
																				/>
																			)}
																			{currentCustomerOrder.recipeTag && (
																				<Tags.Tag
																					tag={
																						currentCustomerOrder.recipeTag
																					}
																					tagStyle={
																						RECIPE_TAG_STYLE.positive
																					}
																					className="p-0.5"
																				/>
																			)}
																			{currentCustomerOrder.beverageTag && (
																				<Tags.Tag
																					tag={
																						currentCustomerOrder.beverageTag
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
																	classNames={{
																		base: 'h-5 w-44 ring-offset-0',
																	}}
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
															name={cooker}
															size={1.5}
															onPress={() => {
																openWindow(
																	'cookers',
																	cooker
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
														content={recipeLabel}
														offset={4}
													>
														<Sprite
															target="recipe"
															name={
																recipeDisplayName
															}
															size={2}
															onPress={() => {
																openWindow(
																	'recipes',
																	recipeDisplayName
																);
															}}
															aria-label={
																recipeLabel
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
															name={beverage}
															size={2}
															onPress={() => {
																openWindow(
																	'beverages',
																	beverage
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
													{recipeIngredients.map(
														(name, index) => {
															const label = `点击：在新窗口中查看食材【${name}】的详情`;
															return (
																<Tooltip
																	key={index}
																	showArrow
																	content={
																		label
																	}
																	offset={4}
																>
																	<Sprite
																		target="ingredient"
																		name={
																			name
																		}
																		size={2}
																		onPress={() => {
																			openWindow(
																				'ingredients',
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
																	name,
																	index
																) => {
																	const label = `额外食材【${name}】`;
																	const alternatives =
																		getAlternatives(
																			name
																		);
																	return (
																		<Popover
																			key={
																				index
																			}
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
																							name={
																								name
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
																						{checkLengthEmpty(
																							alternatives
																						)
																							? '无可用替换'
																							: '可替换为'}
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
																								(
																									altName
																								) => {
																									const altLabel = `点击：在新窗口中查看食材【${altName}】的详情`;
																									return (
																										<Tooltip
																											key={
																												altName
																											}
																											showArrow
																											content={
																												altLabel
																											}
																											size="sm"
																										>
																											<Sprite
																												target="ingredient"
																												name={
																													altName
																												}
																												size={
																													2
																												}
																												onPress={() => {
																													openWindow(
																														'ingredients',
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
													color="primary"
													size="sm"
													variant="flat"
													onPress={() => {
														vibrate();
														if (
															currentRecipeData ===
																null ||
															currentBeverageName ===
																null
														) {
															customerStore.shared.beverage.name.set(
																beverage
															);
														}
														customerStore.shared.recipe.data.set(
															recipeData
														);
														trackEvent(
															trackEvent.category
																.click,
															'Select Button',
															`${recipeData.name} - ${beverage}${checkLengthEmpty(recipeData.extraIngredients) ? '' : ` - ${recipeData.extraIngredients.join(' ')}`}`
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
