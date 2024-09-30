import {forwardRef, useCallback, useMemo} from 'react';
import {twJoin} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Avatar, Card, Divider, PopoverContent, PopoverTrigger, type Selection} from '@nextui-org/react';
import {faArrowsRotate, faXmark} from '@fortawesome/free-solid-svg-icons';

import InfoButton from './infoButton';
import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';
import Tooltip from '@/components/tooltip';

import {customerRatingColorMap} from './constants';
import {CUSTOMER_NORMAL_TAG_STYLE, LABEL_DLC_0, type TCustomerNormalNames} from '@/data';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {customerNormalStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, pinyinSort} from '@/utils';

interface IProps {}

export default forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
	const vibrate = useVibrate();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();
	const selectedCustomerPositiveTags = customerStore.shared.customer.positiveTags.use();
	const currentCustomerPopular = customerStore.shared.customer.popular.use();
	const currentRating = customerStore.shared.customer.rating.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_customer = customerStore.instances.customer.get();
	const instance_ingredient = customerStore.instances.ingredient.get();
	const instance_recipe = customerStore.instances.recipe.get();

	const hasSelected =
		currentBeverageName !== null ||
		currentRecipeData !== null ||
		selectedCustomerBeverageTags.size > 0 ||
		selectedCustomerPositiveTags.size > 0;

	const handleBeverageTagClick = useCallback(
		(tag: TBeverageTag) => {
			vibrate();
			customerStore.onCustomerFilterBeverageTag(tag);
		},
		[vibrate]
	);

	const handleRecipeTagClick = useCallback(
		(tag: TRecipeTag) => {
			vibrate();
			customerStore.onCustomerFilterRecipeTag(tag);
		},
		[vibrate]
	);

	const handleRefreshCustomer = useCallback(() => {
		vibrate();
		customerStore.refreshCustomer();
	}, [vibrate]);

	const handleRefreshSelectedItems = useCallback(
		(customerName: TCustomerNormalNames) => {
			vibrate();
			customerStore.refreshCustomerSelectedItems();
			trackEvent(TrackCategory.Click, 'Reset Button', customerName);
		},
		[vibrate]
	);

	const beverageTags = useMemo(() => {
		const _beverageTags: TBeverageTag[] = [];

		if (currentBeverageName) {
			_beverageTags.push(...instance_beverage.getPropsByName(currentBeverageName, 'tags'));
		}

		return _beverageTags;
	}, [currentBeverageName, instance_beverage]);

	const currentRecipeTagsWithPopular = useMemo(() => {
		const _currentRecipeTagsWithPopular: TRecipeTag[] = [];

		if (currentRecipeData) {
			const {extraIngredients, name: currentRecipeName} = currentRecipeData;

			const recipe = instance_recipe.getPropsByName(currentRecipeName);
			const {ingredients: originalIngredients, positiveTags: originalTags} = recipe;

			const extraTags = extraIngredients.flatMap((extraIngredient) =>
				instance_ingredient.getPropsByName(extraIngredient, 'tags')
			);

			const composedRecipeTags = instance_recipe.composeTagsWithPopular(
				originalIngredients,
				extraIngredients,
				originalTags,
				extraTags,
				currentCustomerPopular
			);

			_currentRecipeTagsWithPopular.push(
				...instance_recipe.calculateTagsWithPopular(composedRecipeTags, currentCustomerPopular)
			);

			setTimeout(() => {
				customerStore.shared.recipe.tagsWithPopular.set(_currentRecipeTagsWithPopular);
			}, 0);
		}

		return _currentRecipeTagsWithPopular;
	}, [currentCustomerPopular, currentRecipeData, instance_ingredient, instance_recipe]);

	const avatarRatingColor = currentRating ? customerRatingColorMap[currentRating] : undefined;
	const avatarRatingContent = currentRating ?? '请选择点单料理以评级';

	const getTagTooltip = useCallback((type: 'beverageTag' | 'recipeTag', selectedTags: Selection, tag: string) => {
		const tagType = type === 'beverageTag' ? '酒水' : '料理';
		const isTagExisted = (selectedTags as SelectionSet).has(tag);

		return `点击：${isTagExisted ? `取消筛选${tagType}表格` : `以此标签筛选${tagType}表格`}`;
	}, []);

	if (currentCustomerName === null) {
		return null;
	}

	const {
		dlc: currentCustomerDlc,
		places: currentCustomerPlaces,
		beverageTags: currentCustomerBeverageTags,
		negativeTags: currentCustomerNegativeTags,
		positiveTags: currentCustomerPositiveTags,
	} = instance_customer.getPropsByName(currentCustomerName);

	const dlcLabel = currentCustomerDlc === 0 ? LABEL_DLC_0 : '';

	const clonedCurrentCustomerPlaces = [...currentCustomerPlaces];
	const currentCustomerMainPlace = clonedCurrentCustomerPlaces.shift();

	const {length: clonedCurrentCustomerPlacesLength} = clonedCurrentCustomerPlaces;

	const placeContent =
		clonedCurrentCustomerPlacesLength > 0
			? `其他出没地区：${clonedCurrentCustomerPlaces.join('、')}`
			: '暂未收录其他出没地区';

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: twJoin(isHighAppearance && 'bg-content1/40 backdrop-blur'),
			}}
			ref={ref}
		>
			<div className="flex flex-col gap-3 p-4 md:flex-row">
				<div className="flex flex-col items-center justify-center gap-3">
					<Popover showArrow color={avatarRatingColor} offset={10}>
						<Tooltip showArrow color={avatarRatingColor} content={avatarRatingContent}>
							<div className="flex cursor-pointer self-center">
								<PopoverTrigger>
									<Avatar
										isBordered={Boolean(currentRating)}
										color={avatarRatingColor}
										radius="sm"
										icon={<Sprite target="customer_normal" name={currentCustomerName} size={6} />}
										role="button"
										tabIndex={0}
										classNames={{
											base: twJoin(
												'h-24 w-24 transition focus:opacity-hover focus:ring-4 focus:ring-focus',
												currentRating ? 'ring-4 ring-offset-0' : 'ring-2 ring-focus dark:ring-0'
											),
											icon: 'block scale-[113%]',
										}}
									/>
								</PopoverTrigger>
							</div>
						</Tooltip>
						<PopoverContent>{avatarRatingContent}</PopoverContent>
					</Popover>
					<div className="min-w-24 gap-2 lg:min-w-28">
						<p className="flex justify-between whitespace-nowrap text-xs font-medium text-default-400 dark:text-default-500">
							<Popover showArrow isTriggerDisabled={!dlcLabel} offset={6}>
								<Tooltip showArrow content={dlcLabel} isDisabled={!dlcLabel} offset={4}>
									<span className={twJoin(!dlcLabel && 'cursor-text')}>
										<PopoverTrigger>
											<span
												role={dlcLabel ? 'button' : undefined}
												tabIndex={dlcLabel ? 0 : undefined}
												title={dlcLabel}
												className={twJoin(
													'opacity-100',
													dlcLabel && 'underline-dotted-offset2'
												)}
											>
												DLC{currentCustomerDlc}
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{dlcLabel}</PopoverContent>
							</Popover>
							<Popover showArrow offset={6}>
								<Tooltip showArrow content={placeContent} offset={4}>
									<span className="cursor-pointer">
										<PopoverTrigger>
											<span
												role="button"
												tabIndex={0}
												className={twJoin(
													clonedCurrentCustomerPlacesLength > 0 && 'underline-dotted-offset2'
												)}
											>
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
							{[...currentCustomerPositiveTags].sort(pinyinSort).map((tag, index) => (
								<Tooltip
									key={index}
									showArrow
									content={getTagTooltip('recipeTag', selectedCustomerPositiveTags, tag)}
									closeDelay={0}
									delay={500}
									isDisabled={!isShowTagsTooltip}
									size="sm"
								>
									<Tags.Tag
										tag={tag}
										tagStyle={CUSTOMER_NORMAL_TAG_STYLE.positive}
										tagType="positive"
										onClick={() => {
											handleRecipeTagClick(tag);
										}}
										onKeyDown={(event) => {
											if (checkA11yConfirmKey(event)) {
												handleRecipeTagClick(tag);
											}
										}}
										aria-label={`${tag}${currentRecipeTagsWithPopular.includes(tag) ? '/已满足' : ''}`}
										role="button"
										tabIndex={0}
										className={twJoin(
											'cursor-pointer p-1 leading-none transition-opacity hover:opacity-hover',
											!currentRecipeTagsWithPopular.includes(tag) && 'opacity-50'
										)}
									/>
								</Tooltip>
							))}
						</TagGroup>
					)}
					{(currentCustomerNegativeTags as string[]).length > 0 && (
						<TagGroup>
							{[...currentCustomerNegativeTags].sort(pinyinSort).map((tag, index) => (
								<Tags.Tag
									key={index}
									tag={tag}
									tagStyle={CUSTOMER_NORMAL_TAG_STYLE.negative}
									tagType="negative"
									className={twJoin(
										'cursor-not-allowed p-1 leading-none',
										!currentRecipeTagsWithPopular.includes(tag) && 'opacity-50'
									)}
								/>
							))}
						</TagGroup>
					)}
					{currentCustomerBeverageTags.length > 0 && (
						<TagGroup>
							{currentCustomerBeverageTags.map((tag, index) => (
								<Tooltip
									key={index}
									showArrow
									content={getTagTooltip('beverageTag', selectedCustomerBeverageTags, tag)}
									closeDelay={0}
									delay={500}
									isDisabled={!isShowTagsTooltip}
									size="sm"
								>
									<Tags.Tag
										tag={tag}
										tagStyle={CUSTOMER_NORMAL_TAG_STYLE.beverage}
										tagType="positive"
										onClick={() => {
											handleBeverageTagClick(tag);
										}}
										onKeyDown={(event) => {
											if (checkA11yConfirmKey(event)) {
												handleBeverageTagClick(tag);
											}
										}}
										aria-label={`${tag}${beverageTags.includes(tag) ? '/已满足' : ''}`}
										role="button"
										tabIndex={0}
										className={twJoin(
											'cursor-pointer p-1 leading-none transition-opacity hover:opacity-hover',
											!beverageTags.includes(tag) && 'opacity-50'
										)}
									/>
								</Tooltip>
							))}
						</TagGroup>
					)}
				</div>
				{hasSelected ? (
					<Tooltip showArrow content="重置当前选定项" offset={4}>
						<FontAwesomeIconButton
							icon={faArrowsRotate}
							variant="light"
							onPress={() => {
								handleRefreshSelectedItems(currentCustomerName);
							}}
							aria-label="重置当前选定项"
							className="absolute -right-0.5 top-1 h-4 w-4 text-default-200 transition-opacity hover:opacity-hover data-[hover=true]:bg-transparent dark:text-default-300"
						/>
					</Tooltip>
				) : (
					<Tooltip showArrow content="取消选择当前顾客" offset={4}>
						<FontAwesomeIconButton
							icon={faXmark}
							variant="light"
							onPress={handleRefreshCustomer}
							aria-label="取消选择当前顾客"
							className="absolute -right-0.5 top-1 h-4 w-4 text-default-200 transition-opacity hover:opacity-hover data-[hover=true]:bg-transparent dark:text-default-300"
						/>
					</Tooltip>
				)}
				<InfoButton />
			</div>
		</Card>
	);
});
