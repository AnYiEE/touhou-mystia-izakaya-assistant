import { cn } from '@heroui/theme';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import PressElement from '@/design/ui/components/pressElement';
import Tooltip from '@/design/ui/components/tooltip';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { getRelatedFoods } from '@/domain/catalog/queries/getRelatedFoods';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';

import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { numberSort } from '@/shared/utilities/sort/numberSort';

interface IProps {
	hiddenDlcs: ReadonlySet<TDlc>;
	ingredient: TIngredientId;
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

export default function IngredientRelatedFoods({
	hiddenDlcs,
	ingredient,
	openWindow,
}: IProps) {
	const { t } = useI18n(catalogItemsMessages);
	useCatalogLocalizationRevision();
	const relatedFoods = getRelatedFoods(
		ingredient,
		FoodCatalog.getInstance().getPinyinSortedData()
	);
	const visibleRelatedFoods = relatedFoods.filter(({ availabilityPaths }) =>
		isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
	);
	if (checkLengthEmpty(visibleRelatedFoods)) {
		return null;
	}
	const relatedFoodsGroupByDlcMap = Map.groupBy(
		visibleRelatedFoods,
		({ dlc }) => dlc
	);
	const relatedFoodsGroupByDlcSorted = [...relatedFoodsGroupByDlcMap].sort(
		([a], [b]) => numberSort(a, b)
	);
	const label = t('items.source.actionRelatedFood');
	return (
		<p>
			<span className="font-semibold">
				{t('items.source.relatedFoods')}
			</span>
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
						{t('items.source.viewRelatedFoods')}
					</span>
				</PopoverTrigger>
				<PopoverContent>
					<div className="flex flex-col gap-2 p-2">
						{relatedFoodsGroupByDlcSorted.map(
							([relatedDlc, foods], dlcIndex) => (
								<div key={dlcIndex}>
									<p className="mb-1 text-small font-medium">
										{getDlcLabel(relatedDlc)}
									</p>
									<div className="grid h-min grid-cols-2 content-start justify-items-start gap-x-4 gap-y-2">
										{foods.map(({ id, name }) => (
											<Tooltip
												key={id}
												showArrow
												closeDelay={0}
												content={label}
												offset={1}
												size="sm"
											>
												<PressElement
													onPress={() => {
														openWindow(
															'foods',
															id,
															name
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
														target="food"
														recordId={id}
														size={1}
														className="mr-0.5"
													/>
													{name}
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
