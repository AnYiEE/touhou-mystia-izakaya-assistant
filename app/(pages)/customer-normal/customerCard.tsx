import {forwardRef, memo, useMemo} from 'react';
import {twJoin} from 'tailwind-merge';

import {
	Avatar,
	Card,
	Divider,
	Popover,
	PopoverContent,
	PopoverTrigger,
	type Selection,
	Tooltip,
} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import InfoButton from './infoButton';
import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerRatingColorMap} from './constants';
import {CUSTOMER_NORMAL_TAG_STYLE} from '@/constants';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {useCustomerNormalStore, useGlobalStore} from '@/stores';
import {checkA11yConfirmKey, intersection, pinyinSort} from '@/utils';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const customerStore = useCustomerNormalStore();
		const globalStore = useGlobalStore();

		const currentCustomerName = customerStore.shared.customer.name.use();
		const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();
		const selectedCustomerPositiveTags = customerStore.shared.customer.positiveTags.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const currentRating = customerStore.shared.customer.rating.use();

		const currentBeverageName = customerStore.shared.beverage.name.use();
		const currentRecipe = customerStore.shared.recipe.data.use();

		const currentGlobalPopular = globalStore.persistence.popular.use();
		const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

		const instance_beverage = customerStore.instances.beverage.get();
		const instance_customer = customerStore.instances.customer.get();
		const instance_ingredient = customerStore.instances.ingredient.get();
		const instance_recipe = customerStore.instances.recipe.get();

		const hasSelected = useMemo(
			() =>
				Boolean(
					currentBeverageName ||
						currentRecipe ||
						selectedCustomerBeverageTags.size > 0 ||
						selectedCustomerPositiveTags.size > 0
				),
			[currentBeverageName, currentRecipe, selectedCustomerBeverageTags, selectedCustomerPositiveTags]
		);

		if (!currentCustomerName) {
			return null;
		}

		const {
			dlc: currentCustomerDlc,
			places: currentCustomerPlaces,
			beverageTags: currentCustomerBeverageTags,
			negativeTags: currentCustomerNegativeTags,
			positiveTags: currentCustomerPositiveTags,
		} = instance_customer.getPropsByName(currentCustomerName);

		const clonedCurrentCustomerPlaces = [...currentCustomerPlaces];
		const currentCustomerMainPlace = clonedCurrentCustomerPlaces.shift();
		const placeContent =
			clonedCurrentCustomerPlaces.length > 0
				? `其他出没地点：${clonedCurrentCustomerPlaces.join('、')}`
				: '暂未收录其他出没地点';

		let beverageTags: TBeverageTag[] = [];
		if (currentBeverageName) {
			const beverage = instance_beverage.getPropsByName(currentBeverageName);
			beverageTags = beverage.tags;
		}

		const currentRecipeTagsWithPopular: TRecipeTag[] = [];
		if (currentRecipe) {
			const {extraIngredients, name: currentRecipeName} = currentRecipe;

			const recipe = instance_recipe.getPropsByName(currentRecipeName);
			const {ingredients: originalIngredients, positiveTags: originalTags} = recipe;

			const extraTags = extraIngredients.flatMap((extraIngredient) =>
				instance_ingredient.getPropsByName(extraIngredient, 'tags')
			);

			const composedRecipeTags = instance_recipe.composeTags(
				originalIngredients,
				extraIngredients,
				originalTags,
				extraTags
			);

			currentRecipeTagsWithPopular.push(
				...instance_recipe.calculateTagsWithPopular(composedRecipeTags, currentCustomerPopular)
			);
			setTimeout(() => {
				customerStore.shared.recipe.tagsWithPopular.set(currentRecipeTagsWithPopular);
			}, 0);
		}

		const avatarRatingColor = currentRating ? customerRatingColorMap[currentRating] : undefined;
		const avatarRatingContent =
			currentRating ?? `请选择${currentBeverageName ? '' : '酒水、'}${currentRecipe ? '' : '料理'}以评级`;

		const getTagTooltip = (selectedTags: Selection, tag: string) =>
			`双击/中键单击：将此标签${(selectedTags as SelectionSet).has(tag) ? '从筛选列表中移除' : '加入至筛选列表中'}`;

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4 md:flex-row">
					<div className="flex flex-col items-center gap-3">
						<Popover showArrow color={avatarRatingColor} offset={11}>
							<Tooltip showArrow color={avatarRatingColor} content={avatarRatingContent}>
								<div className="cursor-pointer">
									<PopoverTrigger>
										<Avatar
											isBordered={Boolean(currentRating)}
											color={avatarRatingColor}
											radius="sm"
											icon={
												<Sprite target="customer_normal" name={currentCustomerName} size={6} />
											}
											role="button"
											tabIndex={0}
											classNames={{
												base: twJoin(
													'h-20 w-20 focus:opacity-hover focus:ring-2 focus:ring-focus lg:h-24 lg:w-24',
													currentRating && 'ring-4'
												),
												icon: 'inline-table lg:inline-block',
											}}
										/>
									</PopoverTrigger>
								</div>
							</Tooltip>
							<PopoverContent>{avatarRatingContent}</PopoverContent>
						</Popover>
						<div className="min-w-24 gap-2 lg:min-w-28">
							<p className="flex justify-between whitespace-nowrap text-xs font-medium text-default-500">
								<span>DLC{currentCustomerDlc}</span>
								<Popover showArrow offset={0}>
									<Tooltip showArrow content={placeContent} offset={-1.5}>
										<span className="cursor-pointer">
											<PopoverTrigger>
												<span role="button" tabIndex={0}>
													{currentCustomerMainPlace}
												</span>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>{placeContent}</PopoverContent>
								</Popover>
							</p>
						</div>
					</div>
					<Divider className="md:hidden" />
					<Divider orientation="vertical" className="hidden md:block" />
					<div className="flex w-full flex-col justify-evenly gap-3 whitespace-nowrap">
						{currentCustomerPositiveTags.length > 0 && (
							<TagGroup>
								{[...currentCustomerPositiveTags].sort(pinyinSort).map((tag) => (
									<Tooltip
										key={tag}
										showArrow
										closeDelay={0}
										content={getTagTooltip(selectedCustomerPositiveTags, tag)}
										isDisabled={!isShowTagsTooltip}
									>
										<Tags.Tag
											tag={tag}
											tagStyle={CUSTOMER_NORMAL_TAG_STYLE.positive}
											onDoubleClick={() => {
												customerStore.onCustomerFilterRecipeTag(tag);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													customerStore.onCustomerFilterRecipeTag(tag);
												}
											}}
											onMouseDown={(event) => {
												if (event.button === 1) {
													event.preventDefault();
													customerStore.onCustomerFilterRecipeTag(tag);
												}
											}}
											aria-label={`${tag}${currentRecipeTagsWithPopular.includes(tag) ? '/已满足' : ''}`}
											role="button"
											tabIndex={0}
											className={twJoin(
												'cursor-pointer select-none py-0.5 hover:opacity-80',
												!currentRecipeTagsWithPopular.includes(tag) && 'opacity-50'
											)}
										/>
									</Tooltip>
								))}
							</TagGroup>
						)}
						{(currentCustomerNegativeTags as string[]).length > 0 && (
							<TagGroup>
								{[...currentCustomerNegativeTags].sort(pinyinSort).map((tag) => (
									<Tags.Tag
										key={tag}
										tag={tag}
										tagStyle={CUSTOMER_NORMAL_TAG_STYLE.negative}
										className={twJoin(
											'cursor-not-allowed py-0.5',
											!currentRecipeTagsWithPopular.includes(tag) && 'opacity-50'
										)}
									/>
								))}
							</TagGroup>
						)}
						{currentCustomerBeverageTags.length > 0 && (
							<TagGroup>
								{intersection(
									customerStore.beverage.tags.get().map(({value}) => value),
									currentCustomerBeverageTags
								).map((tag) => (
									<Tooltip
										key={tag}
										showArrow
										closeDelay={0}
										content={getTagTooltip(selectedCustomerBeverageTags, tag)}
										isDisabled={!isShowTagsTooltip}
									>
										<Tags.Tag
											tag={tag}
											tagStyle={CUSTOMER_NORMAL_TAG_STYLE.beverage}
											onDoubleClick={() => {
												customerStore.onCustomerFilterBeverageTag(tag);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													customerStore.onCustomerFilterBeverageTag(tag);
												}
											}}
											onMouseDown={(event) => {
												if (event.button === 1) {
													event.preventDefault();
													customerStore.onCustomerFilterBeverageTag(tag);
												}
											}}
											aria-label={`${tag}${beverageTags.includes(tag) ? '/已满足' : ''}`}
											role="button"
											tabIndex={0}
											className={twJoin(
												'cursor-pointer select-none py-0.5 hover:opacity-80',
												!beverageTags.includes(tag) && 'opacity-50'
											)}
										/>
									</Tooltip>
								))}
							</TagGroup>
						)}
					</div>
					{hasSelected && (
						<Tooltip showArrow content="重置当前选定项" offset={0} placement="left">
							<FontAwesomeIconButton
								icon={faArrowsRotate}
								variant="light"
								onPress={() => {
									customerStore.shared.customer.popular.set(currentGlobalPopular);
									customerStore.refreshCustomerSelectedItems();
									trackEvent(TrackCategory.Click, 'Reset Button', currentCustomerName);
								}}
								aria-label="重置当前选定项"
								className="absolute -right-1 top-1 h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
							/>
						</Tooltip>
					)}
					<InfoButton />
				</div>
			</Card>
		);
	})
);
