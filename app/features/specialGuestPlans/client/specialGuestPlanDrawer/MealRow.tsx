import Avatar from '@/design/ui/components/avatar';
import {
	type IPopoverProps,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { getEvaluationLabelByKey } from '@/domain/evaluation/localizedLabels';

import RatingAvatarShell from '@/features/catalog/guests/shared/client/components/ratingAvatarShell';
import { Plus } from '@/features/catalog/guests/shared/client/components/resultCardAtoms';
import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import SavedMealIngredientsStrip from '@/features/catalog/guests/shared/client/mealPlanning/savedMealIngredientsStrip';
import {
	BEVERAGE_TAG_STYLE,
	FOOD_TAG_STYLE,
} from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import {
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import { specialGuestPlansMessages } from '@/features/specialGuestPlans/client/messages';
import type { IResolvedSpecialGuestPlanGroup } from '@/features/specialGuestPlans/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

const beverageCatalog = BeverageCatalog.getInstance();
const cookerCatalog = CookerCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const RATING_AVATAR_CLASS_NAMES = { base: 'h-5 w-44 ring-offset-0' } as const;

export default function MealRow({
	meal,
	onOpenBeverage,
	onOpenCooker,
	onOpenFood,
	onOpenIngredient,
	popoverPortalProps,
}: {
	meal: IResolvedSpecialGuestPlanGroup['meals'][number];
	onOpenBeverage: (beverage: TBeverageId) => void;
	onOpenCooker: (cooker: TCookerId) => void;
	onOpenFood: (food: TFoodId) => void;
	onOpenIngredient: (ingredient: TIngredientId) => void;
	popoverPortalProps: Pick<IPopoverProps, 'portalContainer'>;
}) {
	const { t } = useI18n(specialGuestPlansMessages);
	useCatalogLocalizationRevision();
	const {
		cooker,
		evaluation: { isDarkMatter, price, rating: ratingKey },
		meal: { beverage, food: mealFood, hasMystiaCooker, order: guestOrder },
		source,
	} = meal;
	const isDarkMatterOrNormalMeal = isDarkMatter || !hasMystiaCooker;
	const { food, recipe } = foodCatalog.getRecipeOwnerById(mealFood.recipeId);
	const beverageName = beverageCatalog.getDisplayPropsById(beverage, 'name');
	const cookerName = cookerCatalog.getDisplayPropsById(cooker, 'name');
	const displayFood = isDarkMatter
		? foodCatalog.getDisplayPropsById(-1)
		: food;
	const foodName = displayFood.name;
	const rating =
		ratingKey === null
			? t('plans.meal.unrated')
			: getEvaluationLabelByKey(ratingKey);
	const ratingColor = ratingKey ?? 'default';
	const cookerLabel = t('plans.meal.viewCookerTip', { name: cookerName });
	const foodLabel = t('plans.meal.viewFoodTip', { name: foodName });
	const beverageLabel = t('plans.meal.viewBeverageTip', {
		name: beverageName,
	});

	return (
		<div className="relative isolate min-w-0 rounded-small border border-default-200/80 bg-background/35 px-4 py-3 transition-background hover:bg-default/30 motion-reduce:transition-none dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05),0_8px_20px_rgb(0_0_0_/_0.12)] dark:hover:bg-white/[0.085]">
			{source === 'recommended' && (
				<span className="pointer-events-none absolute right-1.5 top-1.5 z-[1] rounded-small bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
					{t('plans.meal.recommended')}
				</span>
			)}
			<div className="relative z-10 flex min-w-0 flex-col flex-wrap items-center gap-2 md:flex-row md:flex-nowrap md:gap-3 min-[1202px]:gap-2">
				<RatingAvatarShell
					color={ratingColor}
					content={rating}
					placement="left"
					popoverProps={popoverPortalProps}
					popoverOffset={12}
					trigger={
						<span
							className="cursor-pointer"
							data-customer-rare-plan-interactive="true"
						>
							<PopoverTrigger>
								<Avatar
									isBordered
									showFallback
									color={ratingColor}
									fallback={
										<TagGroup className="h-4 flex-nowrap items-center whitespace-nowrap">
											{price !== 0 && (
												<Tags.Tag
													className="p-0.5"
													tag={<Price>{price}</Price>}
												/>
											)}
											{guestOrder.foodTag !== null &&
												isDarkMatterOrNormalMeal && (
													<Tags.Tag
														className="p-0.5"
														tag={getFoodTagLabel(
															guestOrder.foodTag
														)}
														tagStyle={
															FOOD_TAG_STYLE.positive
														}
													/>
												)}
											{guestOrder.beverageTag !== null &&
												isDarkMatterOrNormalMeal && (
													<Tags.Tag
														className="p-0.5"
														tag={getBeverageTagLabel(
															guestOrder.beverageTag
														)}
														tagStyle={
															BEVERAGE_TAG_STYLE.positive
														}
													/>
												)}
										</TagGroup>
									}
									radius="sm"
									classNames={RATING_AVATAR_CLASS_NAMES}
								/>
							</PopoverTrigger>
						</span>
					}
				/>
				<div className="flex items-center gap-1 md:gap-2 min-[1202px]:gap-1">
					<Tooltip showArrow content={cookerLabel} offset={8}>
						<Sprite
							recordId={cooker}
							size={1.5}
							target="cooker"
							onPress={() => {
								onOpenCooker(cooker);
							}}
							aria-label={cookerLabel}
							role="button"
						/>
					</Tooltip>
					<Tooltip showArrow content={foodLabel} offset={4}>
						<Sprite
							recordId={displayFood.id}
							size={2}
							target="food"
							onPress={() => {
								onOpenFood(displayFood.id);
							}}
							aria-label={foodLabel}
							role="button"
						/>
					</Tooltip>
					<Plus
						className="mx-0 md:mx-1 min-[1202px]:mx-0"
						size={0.75}
					/>
					<Tooltip showArrow content={beverageLabel} offset={4}>
						<Sprite
							recordId={beverage}
							size={2}
							target="beverage"
							onPress={() => {
								onOpenBeverage(beverage);
							}}
							aria-label={beverageLabel}
							role="button"
						/>
					</Tooltip>
				</div>
				<Plus className="mx-0 md:mx-1 min-[1202px]:mx-0" size={0.75} />
				<div className="relative min-w-0">
					<SavedMealIngredientsStrip
						className="gap-x-1 md:gap-x-3 min-[1202px]:gap-x-1"
						extraIngredients={mealFood.extraIngredients}
						extraIngredientsClassName="gap-x-1 md:gap-x-3 min-[1202px]:gap-x-1"
						onOpenIngredient={onOpenIngredient}
						originalIngredients={recipe.ingredients}
					/>
				</div>
			</div>
		</div>
	);
}
