import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fragment, memo, useEffect, useMemo, useState } from 'react';

import Button from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import {
	type IAvailabilityPath,
	getMissingDlcRequirementPaths,
	isAvailableWithHiddenDlcs,
} from '@/domain/availability';
import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type {
	TIngredientId,
	TIngredientName,
} from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';

import {
	type TCatalogGuestsTranslate,
	catalogGuestsMessages,
} from '@/features/catalog/guests/shared/messages';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	ingredients: ReadonlyArray<TIngredientId>;
	onSelect: () => void;
}

const ingredientCatalog = IngredientCatalog.getInstance();

interface IFoodAvailabilityWarning {
	requirementLabel: string;
	unavailableIngredients: ReadonlyArray<{
		availabilityPaths: ReadonlyArray<IAvailabilityPath>;
		id: TIngredientId;
		name: TIngredientName;
	}>;
}

const foodAvailabilityWarningCache = new WeakMap<
	ReadonlyArray<TIngredientId>,
	Map<string, IFoodAvailabilityWarning>
>();

function formatDlcRequirementPath(
	path: ReadonlyArray<TDlc>,
	t: TCatalogGuestsTranslate
) {
	return path
		.map((dlc) =>
			Object.hasOwn(DLC_LABEL_MAP, dlc) ? getDlcLabel(dlc) : String(dlc)
		)
		.join(t('guests.listSeparator'));
}

function formatDlcRequirementPaths(
	paths: ReadonlyArray<ReadonlyArray<TDlc>>,
	t: TCatalogGuestsTranslate
) {
	if (paths.length === 0) {
		return '';
	}

	if (paths.length === 1) {
		return formatDlcRequirementPath(paths[0] as ReadonlyArray<TDlc>, t);
	}

	if (paths.every((path) => path.length === 1)) {
		const labels = paths.map((path) => formatDlcRequirementPath(path, t));
		const lastLabel = labels.at(-1) as string;
		return `${labels.slice(0, -1).join(t('guests.listSeparator'))}${t(
			'guests.listOr'
		)}${lastLabel}`;
	}

	return paths
		.map((path) =>
			path.length === 1
				? formatDlcRequirementPath(path, t)
				: t('guests.foodAction.dlcAnd', {
						path: formatDlcRequirementPath(path, t),
					})
		)
		.join(t('guests.listJoinOr'));
}

function getFoodAvailabilityWarning(
	ingredients: ReadonlyArray<TIngredientId>,
	hiddenDlcs: ReadonlySet<TDlc>,
	locale: string,
	t: TCatalogGuestsTranslate
) {
	const hiddenDlcsKey = [...hiddenDlcs]
		.sort((left, right) => left - right)
		.join(',');

	const createWarning = () => {
		const unavailableIngredients = [...new Set(ingredients)]
			.map((id) => ({
				availabilityPaths: ingredientCatalog.getDisplayPropsById(
					id,
					'availabilityPaths'
				),
				id,
				name: ingredientCatalog.getDisplayPropsById(id, 'name'),
			}))
			.filter(
				({ availabilityPaths }) =>
					!isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
			);
		return {
			requirementLabel: formatDlcRequirementPaths(
				getMissingDlcRequirementPaths(
					unavailableIngredients.map(
						({ availabilityPaths }) => availabilityPaths
					),
					hiddenDlcs
				),
				t
			),
			unavailableIngredients,
		};
	};

	const warningCache = foodAvailabilityWarningCache.getOrInsertComputed(
		ingredients,
		() => new Map([[`${hiddenDlcsKey}|${locale}`, createWarning()]])
	);

	return warningCache.getOrInsertComputed(
		`${hiddenDlcsKey}|${locale}`,
		createWarning
	);
}

function renderBreakableText(text: string) {
	const tokens = text.match(/DLC\d+|./gu) ?? [];

	return tokens.map((token, index) => (
		<Fragment key={`${token}-${index}`}>
			{token}
			{index < tokens.length - 1 &&
				!/[.,，。、]/u.test(tokens[index + 1] as string) && <wbr />}
		</Fragment>
	));
}

export default memo<IProps>(function FoodTableActionButton({
	ingredients,
	onSelect,
}) {
	const { locale, t } = useI18n(catalogGuestsMessages);
	const [isConfirmPopoverOpen, setIsConfirmPopoverOpen] = useState(false);
	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const { requirementLabel, unavailableIngredients } = useMemo(
		() => getFoodAvailabilityWarning(ingredients, hiddenDlcs, locale, t),
		[hiddenDlcs, ingredients, locale, t]
	);

	useEffect(() => {
		if (unavailableIngredients.length === 0) {
			setIsConfirmPopoverOpen(false);
		}
	}, [unavailableIngredients.length]);

	const handleConfirmPress = () => {
		setIsConfirmPopoverOpen(false);
		onSelect();
	};

	const label = t('guests.foodAction.selectTip');

	if (unavailableIngredients.length === 0) {
		return (
			<div className="flex justify-center">
				<Tooltip showArrow content={label} placement="left" size="sm">
					<Button
						isIconOnly
						size="sm"
						variant="light"
						onPress={onSelect}
						aria-label={label}
					>
						<FontAwesomeIcon icon={faPlus} />
					</Button>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className="flex justify-center">
			<Popover
				shouldBlockScroll
				showArrow
				isOpen={isConfirmPopoverOpen}
				onOpenChange={setIsConfirmPopoverOpen}
			>
				<Tooltip
					showArrow
					color="warning"
					content={label}
					placement="left"
					size="sm"
				>
					<span className="flex">
						<PopoverTrigger>
							<Button
								isIconOnly
								color="warning"
								size="sm"
								variant="light"
								aria-label={t('guests.foodAction.confirmAria')}
							>
								<FontAwesomeIcon icon={faPlus} />
							</Button>
						</PopoverTrigger>
					</span>
				</Tooltip>
				<PopoverContent className="w-auto max-w-[calc(100vw-1rem)] p-2">
					<div className="grid w-64 max-w-full gap-2">
						<p className="text-small font-medium leading-5">
							{t('guests.foodAction.confirmTitle')}
						</p>
						<p className="text-justify text-tiny leading-5 text-foreground-500">
							{t('guests.foodAction.requiredIngredients')}
							{unavailableIngredients.map(
								({ id, name }, index) => (
									<span
										key={id}
										className="whitespace-nowrap text-foreground-700"
									>
										<Sprite
											className="relative -top-px align-middle"
											target="ingredient"
											recordId={id}
											size={1}
										/>
										{name}
										{index <
											unavailableIngredients.length - 1 &&
											t('guests.listSeparator')}
									</span>
								)
							)}
							{renderBreakableText(
								t('guests.foodAction.unavailable', {
									requirement: requirementLabel,
								})
							)}
						</p>
						<div className="mt-1 flex justify-end gap-1">
							<Button
								className="h-8 min-w-0 px-3"
								size="sm"
								variant="light"
								onPress={() => {
									setIsConfirmPopoverOpen(false);
								}}
							>
								{t('guests.foodAction.cancel')}
							</Button>
							<Button
								className="h-8 min-w-0 px-3"
								color="warning"
								size="sm"
								variant="flat"
								onPress={handleConfirmPress}
							>
								{t('guests.foodAction.confirm')}
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
});
