import {
	Fragment,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react';

import { useVibrate, useViewInNewWindow } from '@/hooks';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';

import { Divider } from '@heroui/divider';
import { Select, SelectItem } from '@heroui/select';
import { type Selection } from '@heroui/table';

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

import { Plus } from './resultCard';
import TagGroup from './tagGroup';
import { trackEvent } from '@/components/analytics';
import Ol from '@/components/ol';
import Placeholder from '@/components/placeholder';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {
	BEVERAGE_TAG_STYLE,
	CUSTOMER_RATING_MAP,
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
	RECIPE_TAG_STYLE,
	type TCookerName,
	type TIngredientName,
} from '@/data';
import { customerRareStore as customerStore, globalStore } from '@/stores';
import { checkLengthEmpty, toArray, toSet } from '@/utilities';
import {
	getScoreBasedAlternatives,
	suggestMeals,
} from '@/utils/customer/customer_rare/suggestMeals';

export default function SuggestedMealCard() {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const currentCustomerPopularTrend =
		customerStore.shared.customer.popularTrend.use();
	const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();

	const isSuggestEnabled = customerStore.shared.suggestMeals.enabled.use();
	const suggestMaxResults =
		customerStore.shared.suggestMeals.maxResults.use();
	const selectedSuggestMealsCooker =
		customerStore.shared.suggestMeals.cooker.use();
	const availableRecipeCookers = customerStore.availableRecipeCookers.use();

	const hiddenBeverages =
		customerStore.shared.beverage.table.hiddenBeverages.use();
	const hiddenRecipes = customerStore.shared.recipe.table.hiddenRecipes.use();
	const hiddenIngredients =
		customerStore.shared.recipe.table.hiddenIngredients.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_customer = customerStore.instances.customer.get();
	const instance_ingredient = customerStore.instances.ingredient.get();
	const instance_recipe = customerStore.instances.recipe.get();

	const [alternativesMap, setAlternativesMap] = useState(
		() => new Map<number, Map<TIngredientName, TIngredientName[]>>()
	);

	const selectedCookerKeys = useMemo(
		() =>
			(selectedSuggestMealsCooker === null
				? toSet()
				: toSet(selectedSuggestMealsCooker)) as SelectionSet,
		[selectedSuggestMealsCooker]
	);

	const handleCookerChange = useCallback((keys: Selection) => {
		const selected = toArray(keys as SelectionSet);
		const cooker = (selected[0] as TCookerName | undefined) ?? null;
		customerStore.shared.suggestMeals.cooker.set(cooker);
	}, []);

	useEffect(() => {
		if (currentRecipeData === null) {
			customerStore.shared.suggestMeals.cooker.set(null);
		} else {
			customerStore.shared.suggestMeals.cooker.set(
				instance_recipe.getPropsByName(currentRecipeData.name, 'cooker')
			);
		}
	}, [currentRecipeData, instance_recipe]);

	const hasSelection =
		currentBeverageName !== null || currentRecipeData !== null;
	const hasOrderTags =
		currentCustomerOrder.beverageTag !== null &&
		currentCustomerOrder.recipeTag !== null;
	const isActive =
		isSuggestEnabled &&
		currentCustomerName !== null &&
		(hasOrderTags || (hasMystiaCooker && hasSelection));

	const suggestions = useMemo(() => {
		if (!isActive) {
			return null;
		}

		const results = suggestMeals({
			cooker: selectedSuggestMealsCooker,
			currentBeverage: currentBeverageName,
			currentRecipe: currentRecipeData,
			customerName: currentCustomerName,
			customerOrder: currentCustomerOrder,
			hasMystiaCooker,
			hiddenBeverages,
			hiddenIngredients,
			hiddenRecipes,
			isFamousShop,
			maxResults: suggestMaxResults,
			popularTrend: currentCustomerPopularTrend,
		});

		return checkLengthEmpty(results) ? null : results;
	}, [
		currentBeverageName,
		currentCustomerName,
		currentCustomerOrder,
		currentCustomerPopularTrend,
		currentRecipeData,
		hasMystiaCooker,
		hiddenBeverages,
		hiddenIngredients,
		hiddenRecipes,
		isActive,
		isFamousShop,
		selectedSuggestMealsCooker,
		suggestMaxResults,
	]);

	useLayoutEffect(() => {
		customerStore.shared.suggestMeals.visibility.set(
			suggestions !== null && suggestions.length > 0
		);
	}, [suggestions]);

	const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
	if (prevSuggestions !== suggestions) {
		setPrevSuggestions(suggestions);
		setAlternativesMap(new Map());
	}

	const hasUnsetPopularOrderTag =
		(currentCustomerOrder.recipeTag === DYNAMIC_TAG_MAP.popularPositive ||
			currentCustomerOrder.recipeTag ===
				DYNAMIC_TAG_MAP.popularNegative) &&
		currentCustomerPopularTrend.tag === null;

	let content: IFadeMotionDivProps['children'];
	let contentTarget: IFadeMotionDivProps['target'];

	if (
		isActive &&
		!(
			suggestions === null &&
			currentRecipeData !== null &&
			currentBeverageName !== null
		)
	) {
		const cookerSelect = (
			<div className="flex items-center justify-between gap-2">
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
									根据当前状态自动推荐高评级套餐：
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
										仅展示“满意”评级及以上的结果，评分优先
									</Ol.Li>
									<Ol.Li>
										同评分下优先推荐获取更便利的料理、酒水和食材
									</Ol.Li>
									<Ol.Li>
										超出顾客预算偏好的套餐会被降权，超出预算上限的将被排除
									</Ol.Li>
								</Ol>
								<p>
									搜索范围仅包含本体和当前稀客所属DLC中的料理、酒水和食材，已在设置中选择隐藏的项目不会出现。
								</p>
								<p>
									结果受“流行趋势”和“明星店”效果影响，点击额外食材图标可查看可替换食材。
								</p>
							</div>
						</PopoverContent>
					</Popover>
				</span>
				{currentRecipeData === null && (
					<Select
						disableAnimation={isReducedMotion}
						isVirtualized={false}
						items={availableRecipeCookers}
						placeholder="全部厨具"
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
							base: 'max-w-32',
							listboxWrapper:
								'[&_li]:transition-background focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
							popoverContent: cn({
								'bg-content1/70 backdrop-blur-lg':
									isHighAppearance,
							}),
							trigger: cn(
								'bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
								{ 'backdrop-blur': isHighAppearance }
							),
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
									<span className="ml-1">{value}</span>
								</div>
							</SelectItem>
						)}
					</Select>
				)}
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
					{hasUnsetPopularOrderTag ? (
						<Placeholder className="space-y-2 py-4">
							<p>选定的点单需求包含流行趋势标签</p>
							<p>请您先在设置中指定「流行趋势」</p>
						</Placeholder>
					) : suggestions === null ? (
						<Placeholder className="py-4">
							未找到匹配的推荐套餐
						</Placeholder>
					) : (
						(() => {
							const {
								beverageTags: customerBeverageTags,
								dlc: customerDlc,
								negativeTags: customerNegativeTags,
								positiveTags: customerPositiveTags,
							} = instance_customer.getPropsByName(
								currentCustomerName
							);
							return suggestions.map((meal, loopIndex) => {
								const {
									beverage,
									price,
									rating: ratingKey,
									recipe: recipeData,
								} = meal;
								const isDarkMatter =
									!checkLengthEmpty(
										recipeData.extraIngredients
									) &&
									instance_recipe.checkDarkMatter(recipeData)
										.isDarkMatter;
								const cooker = instance_recipe.getPropsByName(
									recipeData.name,
									'cooker'
								);
								const recipeName = isDarkMatter
									? DARK_MATTER_META_MAP.name
									: recipeData.name;
								const rating = CUSTOMER_RATING_MAP[ratingKey];
								const beverageLabel = `点击：在新窗口中查看酒水【${beverage}】的详情`;
								const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
								const recipeLabel = `点击：在新窗口中查看料理【${recipeName}】的详情`;
								return (
									<Fragment
										key={`${recipeData.name}-${beverage}-${loopIndex}`}
									>
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
															name={recipeName}
															size={2}
															onPress={() => {
																openWindow(
																	'recipes',
																	recipeName
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
												{(() => {
													const {
														ingredients:
															recipeIngredients,
														negativeTags:
															recipeNegativeTags,
														positiveTags:
															recipePositiveTags,
													} = instance_recipe.getPropsByName(
														recipeData.name
													);
													const restExtraIngredientsLength =
														Math.max(
															5 -
																recipeIngredients.length,
															0
														);
													const restExtraIngredients =
														recipeData.extraIngredients.slice(
															0,
															restExtraIngredientsLength
														);
													return (
														<div className="flex items-center gap-x-3 md:gap-x-1 lg:gap-x-3 xl:gap-x-1">
															{recipeIngredients.map(
																(
																	name,
																	index
																) => {
																	const label = `点击：在新窗口中查看食材【${name}】的详情`;
																	return (
																		<Tooltip
																			key={
																				index
																			}
																			showArrow
																			content={
																				label
																			}
																			offset={
																				4
																			}
																		>
																			<Sprite
																				target="ingredient"
																				name={
																					name
																				}
																				size={
																					2
																				}
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
																restExtraIngredients
															) && (
																<div className="flex items-center gap-x-3 rounded bg-content2/70 outline outline-2 outline-offset-1 outline-content2 md:gap-x-1 lg:gap-x-3 xl:gap-x-1">
																	{restExtraIngredients.map(
																		(
																			name,
																			index
																		) => {
																			const label = `额外食材【${name}】`;
																			const alternatives =
																				alternativesMap
																					.get(
																						loopIndex
																					)
																					?.get(
																						name
																					) ??
																				[];
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
																							isOpen &&
																							!alternativesMap.has(
																								loopIndex
																							)
																						) {
																							const beverageTags =
																								instance_beverage.getPropsByName(
																									beverage,
																									'tags'
																								);
																							setAlternativesMap(
																								(
																									prev
																								) => {
																									const next =
																										new Map(
																											prev
																										);
																									next.set(
																										loopIndex,
																										getScoreBasedAlternatives(
																											{
																												baseRating:
																													ratingKey,
																												beverageTags,
																												customerBeverageTags,
																												customerDlc,
																												customerName:
																													currentCustomerName,
																												customerNegativeTags,
																												customerOrder:
																													currentCustomerOrder,
																												customerPositiveTags,
																												extraIngredients:
																													restExtraIngredients,
																												hasMystiaCooker,
																												hiddenIngredients,
																												instance_ingredient,
																												instance_recipe,
																												isFamousShop,
																												popularTrend:
																													currentCustomerPopularTrend,
																												recipeIngredients,
																												recipeName:
																													recipeData.name,
																												recipeNegativeTags,
																												recipePositiveTags,
																											}
																										)
																									);
																									return next;
																								}
																							);
																						}
																					}}
																				>
																					<Tooltip
																						showArrow
																						content={
																							alternativesMap.has(
																								loopIndex
																							) &&
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
																										'flex flex-wrap gap-1',
																										alternatives.length ===
																											1 &&
																											'justify-center'
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
													);
												})()}
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
										{loopIndex < suggestions.length - 1 && (
											<Divider />
										)}
									</Fragment>
								);
							});
						})()
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
