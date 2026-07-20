import { Fragment, memo, useEffect, useMemo, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
} from '@/design/ui/components';

import Sprite from '@/components/sprite';

import { DLC_LABEL_MAP, type TDlc, type TIngredientName } from '@/data';
import { globalStore as store } from '@/stores';
import { Ingredient } from '@/utils';
import {
	type IAvailabilityPath,
	getMissingDlcRequirementPaths,
	isAvailableWithHiddenDlcs,
} from '@/utils/availability';

interface IProps {
	ingredients: ReadonlyArray<TIngredientName>;
	onSelect: () => void;
}

const ingredientInstance = Ingredient.getInstance();

interface IRecipeAvailabilityWarning {
	requirementLabel: string;
	unavailableIngredients: ReadonlyArray<{
		availabilityPaths: ReadonlyArray<IAvailabilityPath>;
		name: TIngredientName;
	}>;
}

const recipeAvailabilityWarningCache = new WeakMap<
	ReadonlyArray<TIngredientName>,
	Map<string, IRecipeAvailabilityWarning>
>();

function formatDlcRequirementPath(path: ReadonlyArray<TDlc>) {
	return path.map((dlc) => DLC_LABEL_MAP[dlc].label).join('、');
}

function formatDlcRequirementPaths(paths: ReadonlyArray<ReadonlyArray<TDlc>>) {
	if (paths.length === 0) {
		return '';
	}

	if (paths.length === 1) {
		return formatDlcRequirementPath(paths[0] as ReadonlyArray<TDlc>);
	}

	if (paths.every((path) => path.length === 1)) {
		const labels = paths.map((path) => formatDlcRequirementPath(path));
		const lastLabel = labels.at(-1) as string;
		return `${labels.slice(0, -1).join('、')}或${lastLabel}`;
	}

	return paths
		.map((path) =>
			path.length === 1
				? formatDlcRequirementPath(path)
				: `同时启用${formatDlcRequirementPath(path)}`
		)
		.join('，或');
}

function getRecipeAvailabilityWarning(
	ingredients: ReadonlyArray<TIngredientName>,
	hiddenDlcs: ReadonlySet<TDlc>
) {
	const hiddenDlcsKey = [...hiddenDlcs]
		.sort((left, right) => left - right)
		.join(',');
	const warningCache = recipeAvailabilityWarningCache.get(ingredients);
	const cachedWarning = warningCache?.get(hiddenDlcsKey);

	if (cachedWarning !== undefined) {
		return cachedWarning;
	}

	const unavailableIngredients = [...new Set(ingredients)]
		.map((name) => ({
			availabilityPaths: ingredientInstance.getPropsByName(
				name,
				'availabilityPaths'
			),
			name,
		}))
		.filter(
			({ availabilityPaths }) =>
				!isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
		);
	const warning = {
		requirementLabel: formatDlcRequirementPaths(
			getMissingDlcRequirementPaths(
				unavailableIngredients.map(
					({ availabilityPaths }) => availabilityPaths
				),
				hiddenDlcs
			)
		),
		unavailableIngredients,
	};

	if (warningCache === undefined) {
		recipeAvailabilityWarningCache.set(
			ingredients,
			new Map([[hiddenDlcsKey, warning]])
		);
	} else {
		warningCache.set(hiddenDlcsKey, warning);
	}

	return warning;
}

function renderBreakableText(text: string) {
	const tokens = text.match(/DLC\d+|./gu) ?? [];

	return tokens.map((token, index) => (
		<Fragment key={`${token}-${index}`}>
			{token}
			{index < tokens.length - 1 &&
				!/[，。、]/u.test(tokens[index + 1] as string) && <wbr />}
		</Fragment>
	));
}

export default memo<IProps>(function RecipeTableActionButton({
	ingredients,
	onSelect,
}) {
	const [isConfirmPopoverOpen, setIsConfirmPopoverOpen] = useState(false);
	const hiddenDlcs = store.hiddenDlcs.use();

	const { requirementLabel, unavailableIngredients } = useMemo(
		() => getRecipeAvailabilityWarning(ingredients, hiddenDlcs),
		[hiddenDlcs, ingredients]
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

	const label = '点击：选择此项';

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
								aria-label="选择此项前确认未启用的数据集"
							>
								<FontAwesomeIcon icon={faPlus} />
							</Button>
						</PopoverTrigger>
					</span>
				</Tooltip>
				<PopoverContent className="w-auto max-w-[calc(100vw-1rem)] p-2">
					<div className="grid w-64 max-w-full gap-2">
						<p className="text-small font-medium leading-5">
							仍要选择此料理吗？
						</p>
						<p className="text-justify text-tiny leading-5 text-foreground-500">
							料理所需食材
							{unavailableIngredients.map(({ name }, index) => (
								<span
									key={name}
									className="whitespace-nowrap text-foreground-700"
								>
									<Sprite
										className="relative -top-px align-middle"
										target="ingredient"
										name={name}
										size={1}
									/>
									{name}
									{index <
										unavailableIngredients.length - 1 &&
										'、'}
								</span>
							))}
							{renderBreakableText(
								`当前不可获取，需要启用${requirementLabel}数据集。`
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
								取消
							</Button>
							<Button
								className="h-8 min-w-0 px-3"
								color="warning"
								size="sm"
								variant="flat"
								onPress={handleConfirmPress}
							>
								仍然选择
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
});
