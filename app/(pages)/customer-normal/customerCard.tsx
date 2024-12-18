import {useCallback, useMemo} from 'react';

import {useVibrate} from '@/hooks';

import {Card, Divider, PopoverContent, PopoverTrigger, type Selection, cn} from '@nextui-org/react';
import {faArrowsRotate, faXmark} from '@fortawesome/free-solid-svg-icons';

import InfoButton from './infoButton';
import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Avatar from '@/components/avatar';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';
import Tooltip from '@/components/tooltip';

import {
	CUSTOMER_NORMAL_TAG_STYLE,
	CUSTOMER_RATING_MAP,
	LABEL_DLC_0,
	type TBeverageTag,
	type TCustomerNormalName,
	type TRecipeTag,
} from '@/data';
import {customerNormalStore as customerStore, globalStore} from '@/stores';
import {pinyinSort} from '@/utils';

export default function CustomerCard() {
	const vibrate = useVibrate();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();
	const selectedCustomerPositiveTags = customerStore.shared.customer.positiveTags.use();
	const currentCustomerPopular = customerStore.shared.customer.popular.use();
	const currentRating = customerStore.shared.customer.rating.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_customer = customerStore.instances.customer.get();
	const instance_ingredient = customerStore.instances.ingredient.get();
	const instance_recipe = customerStore.instances.recipe.get();

	const hasRating = currentRating !== null;

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
		customerStore.shared.customer.name.set(null);
	}, [vibrate]);

	const handleRefreshSelectedItems = useCallback(
		(customerName: TCustomerNormalName) => {
			vibrate();
			customerStore.refreshCustomerSelectedItems();
			trackEvent(TrackCategory.Click, 'Reset Button', customerName);
		},
		[vibrate]
	);

	const beverageTags = useMemo(() => {
		const _beverageTags: TBeverageTag[] = [];

		if (currentBeverageName !== null) {
			_beverageTags.push(...instance_beverage.getPropsByName(currentBeverageName, 'tags'));
		}

		return _beverageTags;
	}, [currentBeverageName, instance_beverage]);

	const currentRecipeTagsWithPopular = useMemo(() => {
		const _currentRecipeTagsWithPopular: TRecipeTag[] = [];

		if (currentRecipeData !== null) {
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
				...instance_recipe.calculateTagsWithPopular(composedRecipeTags, currentCustomerPopular, isFamousShop)
			);

			setTimeout(() => {
				customerStore.shared.recipe.tagsWithPopular.set(_currentRecipeTagsWithPopular);
			}, 0);
		}

		return _currentRecipeTagsWithPopular;
	}, [currentCustomerPopular, currentRecipeData, instance_ingredient, instance_recipe, isFamousShop]);

	const avatarRatingContent = currentRating === null ? '请选择点单料理以评级' : CUSTOMER_RATING_MAP[currentRating];

	const avatarRatingColor = hasRating ? (`${currentRating}-border` as const) : undefined;
	const tooltipRatingColor = hasRating ? currentRating : undefined;

	const getTagTooltip = useCallback((type: 'beverageTag' | 'recipeTag', selectedTags: Selection, tag: string) => {
		const tagType = type === 'beverageTag' ? '酒水' : '料理';
		const isTagExisted = (selectedTags as SelectionSet).has(tag);

		return `点击：${isTagExisted ? `取消筛选${tagType}表格` : `以此标签筛选${tagType}表格`}`;
	}, []);

	if (currentCustomerName === null) {
		return null;
	}

	const {
		beverageTags: currentCustomerBeverageTags,
		dlc: currentCustomerDlc,
		negativeTags: currentCustomerNegativeTags,
		places: currentCustomerPlaces,
		positiveTags: currentCustomerPositiveTags,
	} = instance_customer.getPropsByName(currentCustomerName);

	const dlcLabel = currentCustomerDlc === 0 ? LABEL_DLC_0 : '';

	const clonedCurrentCustomerPlaces = [...currentCustomerPlaces];
	const currentCustomerMainPlace = clonedCurrentCustomerPlaces.shift();

	const hasOtherPlaces = clonedCurrentCustomerPlaces.length > 0;

	const placeContent = hasOtherPlaces
		? `其他出没地区：${clonedCurrentCustomerPlaces.join('、')}`
		: '暂未收录其他出没地区';

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: cn({
					'bg-content1/40 backdrop-blur': isHighAppearance,
				}),
			}}
		>
			<div className="flex flex-col gap-3 p-4 md:flex-row">
				<div className="flex flex-col items-center justify-center gap-3">
					<Popover showArrow color={tooltipRatingColor} offset={10}>
						<Tooltip showArrow color={tooltipRatingColor} content={avatarRatingContent} offset={8}>
							<div className="flex cursor-pointer self-center">
								<PopoverTrigger>
									<Avatar
										isBordered={hasRating}
										color={avatarRatingColor}
										radius="sm"
										icon={<Sprite target="customer_normal" name={currentCustomerName} size={6} />}
										role="button"
										tabIndex={0}
										classNames={{
											base: cn(
												'h-24 w-24 transition focus:opacity-hover focus:ring-4 focus:ring-focus',
												hasRating ? 'ring-4 ring-offset-0' : 'ring-2 ring-focus dark:ring-0'
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
							<Popover showArrow isTriggerDisabled={!dlcLabel} offset={4}>
								<Tooltip showArrow content={dlcLabel} isDisabled={!dlcLabel} offset={0}>
									<span
										className={cn({
											'cursor-text': !dlcLabel,
										})}
									>
										<PopoverTrigger>
											<span
												role={dlcLabel ? 'button' : undefined}
												tabIndex={dlcLabel ? 0 : undefined}
												title={dlcLabel}
												className={cn('opacity-100', {
													'underline-dotted-linear': dlcLabel,
												})}
											>
												DLC{currentCustomerDlc}
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{dlcLabel}</PopoverContent>
							</Popover>
							<Popover showArrow offset={hasOtherPlaces ? 6 : 4}>
								<Tooltip showArrow content={placeContent} offset={2}>
									<span className="cursor-pointer">
										<PopoverTrigger>
											<span
												role="button"
												tabIndex={0}
												className={cn({
													'underline-dotted-linear': hasOtherPlaces,
												})}
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
										onPress={() => {
											handleRecipeTagClick(tag);
										}}
										aria-label={`${tag}${currentRecipeTagsWithPopular.includes(tag) ? '/已满足' : ''}`}
										role="button"
										tabIndex={0}
										className={cn(
											'cursor-pointer p-1 font-semibold leading-none transition-opacity hover:opacity-hover',
											{
												'font-normal opacity-50': !currentRecipeTagsWithPopular.includes(tag),
											}
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
									className={cn('cursor-not-allowed p-1 font-semibold leading-none', {
										'font-normal opacity-50': !currentRecipeTagsWithPopular.includes(tag),
									})}
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
										onPress={() => {
											handleBeverageTagClick(tag);
										}}
										aria-label={`${tag}${beverageTags.includes(tag) ? '/已满足' : ''}`}
										role="button"
										tabIndex={0}
										className={cn(
											'cursor-pointer p-1 font-semibold leading-none transition-opacity hover:opacity-hover',
											{
												'font-normal opacity-50': !beverageTags.includes(tag),
											}
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
}
