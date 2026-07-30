import { cn } from '@heroui/theme';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import PressElement from '@/design/ui/components/pressElement';
import Tooltip from '@/design/ui/components/tooltip';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { Recipe } from '@/domain/catalog/food/Recipe';
import type { TRecipe } from '@/domain/catalog/food/types';
import { getRelatedRecipes } from '@/domain/catalog/queries/getRelatedRecipes';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';

import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { toArray } from '@/shared/utilities/collections/convert';
import { numberSort } from '@/shared/utilities/sort/numberSort';

interface IProps {
	hiddenDlcs: ReadonlySet<TDlc>;
	name: TIngredientName;
	openWindow: (path: TItemRoutePath, name: TShareableItemName) => void;
}

export default function IngredientRelatedRecipes({
	hiddenDlcs,
	name,
	openWindow,
}: IProps) {
	const relatedRecipes = getRelatedRecipes(
		name,
		Recipe.getInstance().getPinyinSortedData().get()
	);
	if (checkLengthEmpty(relatedRecipes)) {
		return null;
	}
	const relatedRecipesGroupByDlcMap = relatedRecipes.reduce((map, item) => {
		if (!isAvailableWithHiddenDlcs(item.availabilityPaths, hiddenDlcs)) {
			return map;
		}
		if (!map.has(item.dlc)) {
			map.set(item.dlc, []);
		}
		(map.get(item.dlc) as TRecipe[]).push(item);
		return map;
	}, new Map<TDlc, TRecipe[]>());
	const relatedRecipesGroupByDlcSorted = toArray(
		relatedRecipesGroupByDlcMap
	).sort(([a], [b]) => numberSort(a, b));
	const label = '点击：在新窗口中查看此料理的详情';
	return (
		<p>
			<span className="font-semibold">关联料理：</span>
			<Popover offset={5} placement="bottom-start" size="sm">
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
							([relatedDlc, recipes], dlcIndex) => (
								<div key={dlcIndex}>
									<p className="mb-1 text-small font-medium">
										{DLC_LABEL_MAP[relatedDlc].label}
									</p>
									<div className="grid h-min grid-cols-2 content-start justify-items-start gap-x-4 gap-y-2">
										{recipes.map(({ name: recipeName }) => (
											<Tooltip
												key={recipeName}
												showArrow
												closeDelay={0}
												content={label}
												offset={1}
												size="sm"
											>
												<PressElement
													onPress={() => {
														openWindow(
															'recipes',
															recipeName
														);
													}}
													aria-label={label}
													role="button"
													tabIndex={0}
													className={cn(
														'underline-dotted-offset2 inline-flex cursor-pointer items-center text-tiny',
														CLASSNAME_FOCUS_VISIBLE_OUTLINE
													)}
												>
													<Sprite
														target="recipe"
														name={recipeName}
														size={1}
														className="mr-0.5"
													/>
													{recipeName}
												</PressElement>
											</Tooltip>
										))}
									</div>
								</div>
							)
						)}
					</div>
				</PopoverContent>
			</Popover>
		</p>
	);
}
