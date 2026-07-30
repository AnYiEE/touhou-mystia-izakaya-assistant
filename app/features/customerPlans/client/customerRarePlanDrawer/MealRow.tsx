import Avatar from '@/design/ui/components/avatar';
import {
	type IPopoverProps,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import { CUSTOMER_RATING_MAP } from '@/domain/evaluation/labels';

import { customerPlanCatalogPort } from '@/features/catalog/customers/rare/client/state/customerPlanCatalogPort';
import RatingAvatarShell from '@/features/catalog/customers/shared/client/components/ratingAvatarShell';
import { Plus } from '@/features/catalog/customers/shared/client/components/resultCardAtoms';
import TagGroup from '@/features/catalog/customers/shared/client/components/tagGroup';
import SavedMealIngredientsStrip from '@/features/catalog/customers/shared/client/mealPlanning/savedMealIngredientsStrip';
import {
	BEVERAGE_TAG_STYLE,
	RECIPE_TAG_STYLE,
} from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import type {
	ICustomerRareMeal,
	IResolvedCustomerRarePlanGroup,
} from '@/features/customerPlans/contracts';

export default function MealRow({
	meal,
	onOpenBeverage,
	onOpenCooker,
	onOpenIngredient,
	onOpenRecipe,
	popoverPortalProps,
}: {
	meal: IResolvedCustomerRarePlanGroup['meals'][number];
	onOpenBeverage: (beverageName: TBeverageName) => void;
	onOpenCooker: (cookerName: TCookerName) => void;
	onOpenIngredient: (
		ingredientName: ICustomerRareMeal['recipe']['extraIngredients'][number]
	) => void;
	onOpenRecipe: (recipeName: TRecipeName) => void;
	popoverPortalProps: Pick<IPopoverProps, 'portalContainer'>;
}) {
	const instanceRecipe = customerPlanCatalogPort.recipe.get();
	const {
		evaluation: { isDarkMatter, price, rating: ratingKey },
		meal: {
			beverage,
			hasMystiaCooker,
			order: customerOrder,
			recipe: recipeData,
		},
		source,
	} = meal;
	const isDarkMatterOrNormalMeal = isDarkMatter || !hasMystiaCooker;
	const resolvedRecipe = instanceRecipe.resolveMealRecipe(recipeData);
	const originalCooker = resolvedRecipe.cooker;
	const cooker = isDarkMatterOrNormalMeal
		? originalCooker
		: (`夜雀${originalCooker}` as const);
	const recipeName = isDarkMatter
		? DARK_MATTER_META_MAP.name
		: recipeData.name;
	const rating =
		ratingKey === null ? '未评级' : CUSTOMER_RATING_MAP[ratingKey];
	const ratingColor = ratingKey ?? 'default';
	const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
	const recipeLabel = `点击：在新窗口中查看料理【${recipeName}】的详情`;
	const beverageLabel = `点击：在新窗口中查看酒水【${beverage}】的详情`;

	return (
		<div className="relative isolate min-w-0 rounded-small border border-default-200/80 bg-background/35 px-4 py-3 transition-background hover:bg-default/30 motion-reduce:transition-none dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05),0_8px_20px_rgb(0_0_0_/_0.12)] dark:hover:bg-white/[0.085]">
			{source === 'recommended' && (
				<span className="pointer-events-none absolute right-1.5 top-1.5 z-[1] rounded-small bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
					推荐
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
													tagStyle={{}}
												/>
											)}
											{customerOrder.recipeTag &&
												isDarkMatterOrNormalMeal && (
													<Tags.Tag
														className="p-0.5"
														tag={
															customerOrder.recipeTag
														}
														tagStyle={
															RECIPE_TAG_STYLE.positive
														}
													/>
												)}
											{customerOrder.beverageTag &&
												isDarkMatterOrNormalMeal && (
													<Tags.Tag
														className="p-0.5"
														tag={
															customerOrder.beverageTag
														}
														tagStyle={
															BEVERAGE_TAG_STYLE.positive
														}
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
					}
				/>
				<div className="flex items-center gap-1 md:gap-2 min-[1202px]:gap-1">
					<Tooltip showArrow content={cookerLabel} offset={8}>
						<Sprite
							name={cooker}
							size={1.5}
							target="cooker"
							onPress={() => {
								onOpenCooker(cooker);
							}}
							aria-label={cookerLabel}
							role="button"
						/>
					</Tooltip>
					<Tooltip showArrow content={recipeLabel} offset={4}>
						<Sprite
							name={recipeName}
							size={2}
							target="recipe"
							onPress={() => {
								onOpenRecipe(recipeName);
							}}
							aria-label={recipeLabel}
							role="button"
						/>
					</Tooltip>
					<Plus
						className="mx-0 md:mx-1 min-[1202px]:mx-0"
						size={0.75}
					/>
					<Tooltip showArrow content={beverageLabel} offset={4}>
						<Sprite
							name={beverage}
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
						extraIngredients={recipeData.extraIngredients}
						extraIngredientsClassName="gap-x-1 md:gap-x-3 min-[1202px]:gap-x-1"
						onOpenIngredient={onOpenIngredient}
						originalIngredients={resolvedRecipe.baseIngredients}
					/>
				</div>
			</div>
		</div>
	);
}
