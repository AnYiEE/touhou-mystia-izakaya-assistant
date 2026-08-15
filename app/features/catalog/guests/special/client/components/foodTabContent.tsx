import {
	faChevronDown,
	faMagnifyingGlass,
	faTags,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Select, SelectItem } from '@heroui/select';
import { type SortDescriptor } from '@heroui/table';
import { cn } from '@heroui/theme';
import { useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

import FoodTableActionButton from '@/features/catalog/guests/shared/client/components/foodTableActionButton';
import FoodTableShell from '@/features/catalog/guests/shared/client/components/foodTableShell';
import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import type { TFoodSuitabilityRow } from '@/features/catalog/guests/shared/contracts';
import {
	type ITableSortDescriptor,
	type TFoodTableColumnKey,
	type TFoodTableSortKey,
	foodTableColumns,
} from '@/features/catalog/guests/shared/state/tableDescriptors';
import { foodTagSelectionAdapter } from '@/features/catalog/guests/shared/state/tagSelectionAdapter';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { SPECIAL_GUEST_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

const cookerCatalog = CookerCatalog.getInstance();
const FOOD_AUTOCOMPLETE_ITEM_CLASS_NAMES = {
	base: '[&>span+span]:hidden [&>span]:inline-flex',
} as const;
const FOOD_TABLE_DISABLED_KEYS = [
	'action',
	'food',
] as const satisfies ReadonlyArray<TFoodTableColumnKey>;
const TABLE_DROPDOWN_ITEM_CLASSES = {
	base: 'transition-background motion-reduce:transition-none',
} as const;

export default function FoodTabContent() {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const selectedGuestFoodTags =
		specialGuestStore.shared.guest.select.foodTag.use();
	const selectedGuestFoodTagKeys = useMemo(
		() => foodTagSelectionAdapter.toSelectedKeys(selectedGuestFoodTags),
		[selectedGuestFoodTags]
	);

	const currentMealFood = specialGuestStore.shared.recipe.data.use();
	const selectedRecipeId = currentMealFood?.recipeId ?? null;
	const selectedCookerTypes = specialGuestStore.foodTableCookerTypes.use();
	const selectedAvailabilityDlcs =
		specialGuestStore.foodTableAvailabilityDlcs.use();

	const availableFoodCookers = specialGuestStore.availableFoodCookers.use();
	const availableFoodAvailabilityDlcs =
		specialGuestStore.availableFoodAvailabilityDlcs.use();
	const availableFoods = specialGuestStore.availableFoods.use();
	const availableFoodTags = specialGuestStore.availableFoodTags.use();

	const searchValue = specialGuestStore.shared.recipe.searchValue.use();

	const tableCurrentPage = specialGuestStore.shared.recipe.table.page.use();
	const tableRowsPerPage = specialGuestStore.shared.recipe.table.rows.use();
	const tableSelectableRows =
		specialGuestStore.shared.recipe.table.selectableRows.get();
	const tableSortDescriptor =
		specialGuestStore.persistence.recipe.table.sortDescriptor.use();
	const tableVisibleColumns =
		specialGuestStore.shared.recipe.table.columns.use();

	const {
		pagedRows: tableCurrentPageItems,
		sortedRows: tableSortedRows,
		totalPages: tableTotalPages,
	} = specialGuestStore.foodTableRows.use();

	const tableHeaderColumns = useMemo(
		() =>
			foodTableColumns.filter(({ key }) => tableVisibleColumns.has(key)),
		[tableVisibleColumns]
	);

	const tableSelectedKeys = useMemo(
		() =>
			new Set<number>(
				selectedRecipeId === null ? [] : [selectedRecipeId]
			),
		[selectedRecipeId]
	);

	const renderTableCell = useCallback(
		(foodRow: TFoodSuitabilityRow, columnKey: TFoodTableColumnKey) => {
			const {
				cookTime,
				cookerType,
				id: food,
				ingredients,
				matchedPositiveTags,
				name,
				positiveTags,
				price,
				recipeId,
				suitability,
			} = foodRow;
			const matchedNegativeTags = foodRow.matchedNegativeTags ?? [];
			const cookerTypeLabel = COOKER_TYPE_LABEL_MAP[cookerType];
			const ingredientEntries = ingredients.map((id) => ({
				id,
				name: IngredientCatalog.getInstance().getPropsById(id, 'name'),
			}));

			if (currentSpecialGuest === null) {
				return null;
			}

			const { negative: negativeTagStyle, positive: positiveTagStyle } =
				SPECIAL_GUEST_TAG_STYLE;

			const tags = (
				<TagGroup>
					{positiveTags
						.toSorted((a, b) =>
							pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
						)
						.map((tag) => {
							const tagLabel = FOOD_TAG_MAP[tag];
							const isNegativeTagMatched =
								matchedNegativeTags.includes(tag);
							const isPositiveTagMatched =
								matchedPositiveTags.includes(tag);
							const isTagMatched =
								isNegativeTagMatched || isPositiveTagMatched;
							const tagStyle = isNegativeTagMatched
								? negativeTagStyle
								: isPositiveTagMatched
									? positiveTagStyle
									: undefined;
							const tagType = isNegativeTagMatched
								? 'negative'
								: isPositiveTagMatched
									? 'positive'
									: null;
							return (
								<Tags.Tag
									key={tag}
									tag={tagLabel}
									tagStyle={tagStyle}
									tagType={tagType}
									className={cn({
										'opacity-50': !isTagMatched,
									})}
								/>
							);
						})}
				</TagGroup>
			);

			switch (columnKey) {
				case 'food': {
					const label = `点击：在新窗口中查看料理【${name}】的详情`;
					return (
						<div className="flex items-center">
							<Tooltip
								showArrow
								content={label}
								placement="right"
								size="sm"
							>
								<Sprite
									target="food"
									recordId={food}
									size={2}
									onPress={() => {
										openWindow('foods', food, name);
									}}
									aria-label={label}
									role="button"
									className="mr-2"
								/>
							</Tooltip>
							<div className="inline-flex flex-1 items-center whitespace-nowrap">
								<span className="text-small font-medium">
									{name}
								</span>
								<span className="ml-0.5">
									<Popover showArrow offset={10} size="sm">
										<Tooltip
											showArrow
											content={tags}
											offset={5}
											placement="right"
											size="sm"
										>
											<span className="inline-flex">
												<PopoverTrigger>
													<FontAwesomeIconButton
														icon={faTags}
														variant="light"
														aria-label="料理标签"
														className="inline h-4 w-4 min-w-0 scale-75 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover"
													/>
												</PopoverTrigger>
											</span>
										</Tooltip>
										<PopoverContent>{tags}</PopoverContent>
									</Popover>
								</span>
							</div>
						</div>
					);
				}
				case 'cookerType':
					return (
						<div className="flex">
							<Tooltip
								showArrow
								content={cookerTypeLabel}
								placement="left"
								size="sm"
							>
								<Sprite
									target="cooker"
									recordId={cookerCatalog.getIdByTypeAndSeries(
										cookerType,
										0
									)}
									size={1.5}
								/>
							</Tooltip>
						</div>
					);
				case 'ingredient':
					return (
						<div className="flex flex-nowrap">
							{ingredientEntries.map(
								({ id, name: ingredient }, index) => {
									const ingredientLabel = `点击：在新窗口中查看食材【${ingredient}】的详情`;
									return (
										<Tooltip
											key={`${id}-${index}`}
											showArrow
											content={ingredientLabel}
											size="sm"
										>
											<Sprite
												target="ingredient"
												recordId={id}
												size={1.5}
												onPress={() => {
													openWindow(
														'ingredients',
														id,
														ingredient
													);
												}}
												aria-label={ingredientLabel}
												role="button"
											/>
										</Tooltip>
									);
								}
							)}
						</div>
					);
				case 'price':
					return (
						<div className="flex">
							<Price>{price}</Price>
						</div>
					);
				case 'suitability':
					return (
						<div className="flex">
							{suitability === Infinity ||
							suitability === -Infinity ? (
								'固定评级'
							) : (
								<Price showSymbol={false}>{suitability}</Price>
							)}
						</div>
					);
				case 'time':
					return (
						<div className="flex whitespace-nowrap">
							{cookTime.min}
							<span className="mx-0.5">-</span>
							{cookTime.max}秒
						</div>
					);
				case 'action':
					return (
						<FoodTableActionButton
							ingredients={ingredients}
							onSelect={() => {
								vibrate();
								specialGuestStore.onFoodTableAction(
									food,
									recipeId
								);
							}}
						/>
					);
			}
		},
		[currentSpecialGuest, openWindow, vibrate]
	);

	const tableToolbar = useMemo(
		() => (
			<div className="flex flex-col gap-2">
				<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
					<div className="flex flex-1 items-end gap-3">
						<Autocomplete
							allowsCustomValue
							defaultItems={availableFoods}
							disableAnimation={isReducedMotion}
							inputValue={searchValue}
							isVirtualized={false}
							placeholder="名称"
							size="sm"
							startContent={
								<FontAwesomeIcon
									icon={faMagnifyingGlass}
									className="pointer-events-none"
								/>
							}
							variant="flat"
							onInputChange={(value) => {
								vibrate(!value);
								specialGuestStore.onFoodTableSearchValueChange(
									value
								);
							}}
							aria-label="选择或输入料理名称"
							title="选择或输入料理名称"
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: cn(
									'data-[slot="input-wrapper"]:[&_div]:!bg-default/40 data-[slot="input-wrapper"]:data-[hover=true]:[&_div]:opacity-hover data-[slot="input-wrapper"]:[&_div]:transition-opacity data-[slot="input-wrapper"]:[&_div]:!duration-250 motion-reduce:data-[slot="input-wrapper"]:[&_div]:transition-none',
									{ 'backdrop-blur': isHighAppearance }
								),
								listboxWrapper:
									'[&_li]:transition-background data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
								popoverContent: cn({
									'bg-content1/70 backdrop-blur-lg':
										isHighAppearance,
								}),
							}}
						>
							{({ id, name }) => (
								<AutocompleteItem
									key={id.toString()}
									textValue={name}
									classNames={
										FOOD_AUTOCOMPLETE_ITEM_CLASS_NAMES
									}
								>
									<span className="inline-flex items-center">
										<Sprite
											target="food"
											recordId={id}
											size={1}
										/>
										<span className="ml-1">{name}</span>
									</span>
								</AutocompleteItem>
							)}
						</Autocomplete>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={availableFoodTags}
							placeholder="标签"
							selectedKeys={selectedGuestFoodTagKeys}
							size="sm"
							startContent={<FontAwesomeIcon icon={faTags} />}
							variant="flat"
							onSelectionChange={
								specialGuestStore.onFoodTableSelectedPositiveTagsChange
							}
							aria-label="选择顾客所点单的料理标签"
							title="选择顾客所点单的料理标签"
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: 'w-2/3 md:w-full',
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
								<SelectItem key={value.toString()}>
									{FOOD_TAG_MAP[value as TFoodTagId]}
								</SelectItem>
							)}
						</Select>
					</div>
					<div className="flex w-full gap-3 md:w-auto">
						<Dropdown showArrow>
							<DropdownTrigger>
								<Button
									endContent={
										<FontAwesomeIcon icon={faChevronDown} />
									}
									size="sm"
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{
											'backdrop-blur': isHighAppearance,
											'ring-2 ring-default':
												!checkLengthEmpty(
													selectedCookerTypes
												),
										}
									)}
								>
									厨具
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								closeOnSelect={false}
								items={availableFoodCookers}
								selectedKeys={selectedCookerTypes}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={
									specialGuestStore.onFoodTableSelectedCookerTypesChange
								}
								aria-label="选择目标料理所使用的厨具"
								itemClasses={TABLE_DROPDOWN_ITEM_CLASSES}
							>
								{({ cookerType, id, name }) => (
									<DropdownItem
										key={cookerType.toString()}
										textValue={name}
									>
										<div className="flex items-center">
											<Sprite
												target="cooker"
												recordId={id}
												size={1}
											/>
											<span className="ml-1">{name}</span>
										</div>
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
						{availableFoodAvailabilityDlcs.length > 1 && (
							<Dropdown showArrow>
								<DropdownTrigger>
									<Button
										endContent={
											<FontAwesomeIcon
												icon={faChevronDown}
											/>
										}
										size="sm"
										variant="light"
										className={cn(
											'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
											{
												'backdrop-blur':
													isHighAppearance,
												'ring-2 ring-default':
													!checkLengthEmpty(
														selectedAvailabilityDlcs
													),
											}
										)}
									>
										可获取于
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									closeOnSelect={false}
									items={availableFoodAvailabilityDlcs}
									selectedKeys={selectedAvailabilityDlcs}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={
										specialGuestStore.onFoodTableSelectedAvailabilityDlcsChange
									}
									aria-label="按可获取内容筛选料理"
									itemClasses={TABLE_DROPDOWN_ITEM_CLASSES}
								>
									{({ value }) => (
										<DropdownItem
											key={value.toString()}
											textValue={value.toString()}
										>
											{value === 0
												? DLC_LABEL_MAP[0].label
												: DLC_LABEL_MAP[value]
														.shortLabel ||
													DLC_LABEL_MAP[value].label}
										</DropdownItem>
									)}
								</DropdownMenu>
							</Dropdown>
						)}
						<Dropdown showArrow>
							<DropdownTrigger>
								<Button
									endContent={
										<FontAwesomeIcon icon={faChevronDown} />
									}
									size="sm"
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{ 'backdrop-blur': isHighAppearance }
									)}
								>
									条目
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								disallowEmptySelection
								closeOnSelect={false}
								disabledKeys={FOOD_TABLE_DISABLED_KEYS}
								items={foodTableColumns}
								selectedKeys={tableVisibleColumns}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={
									globalStore.foodTableColumns.set
								}
								aria-label="选择表格所显示的列"
								itemClasses={TABLE_DROPDOWN_ITEM_CLASSES}
							>
								{({ key, label }) => (
									<DropdownItem key={key}>
										{label}
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>
				<div className="flex items-center justify-between text-small text-default-700">
					<span>共{tableSortedRows.length}套食谱</span>
					<label className="flex items-center gap-2">
						<span className="cursor-auto whitespace-nowrap">
							表格行数
						</span>
						<Select
							disallowEmptySelection
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={tableSelectableRows}
							selectedKeys={tableRowsPerPage}
							size="sm"
							variant="flat"
							onSelectionChange={
								globalStore.onTableRowsPerPageChange
							}
							aria-label="选择表格每页最大行数"
							title="选择表格每页最大行数"
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: 'min-w-16',
								listboxWrapper:
									'[&_li]:transition-background focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
								popoverContent: cn('min-w-20', {
									'bg-content1/70 backdrop-blur-lg':
										isHighAppearance,
								}),
								trigger: cn(
									'h-6 min-h-6 bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
									{ 'backdrop-blur': isHighAppearance }
								),
								value: '!text-default-700',
							}}
						>
							{({ value }) => (
								<SelectItem
									key={value.toString()}
									textValue={value.toString()}
								>
									{value}
								</SelectItem>
							)}
						</Select>
					</label>
				</div>
			</div>
		),
		[
			availableFoodCookers,
			availableFoodAvailabilityDlcs,
			availableFoods,
			availableFoodTags,
			isHighAppearance,
			isReducedMotion,
			popoverMotionProps,
			searchValue,
			selectedAvailabilityDlcs,
			selectedCookerTypes,
			selectedGuestFoodTagKeys,
			tableSortedRows.length,
			tableRowsPerPage,
			tableSelectableRows,
			tableVisibleColumns,
			vibrate,
		]
	);
	const handleTablePageChange = useCallback(
		(page: number) => {
			vibrate();
			specialGuestStore.onFoodTablePageChange(page);
		},
		[vibrate]
	);
	const handleTableSortChange = useCallback(
		(config: SortDescriptor) => {
			vibrate();
			specialGuestStore.onFoodTableSortChange(
				config as ITableSortDescriptor<TFoodTableSortKey>
			);
		},
		[vibrate]
	);

	return (
		<FoodTableShell
			headerColumns={tableHeaderColumns}
			isHighAppearance={isHighAppearance}
			isReducedMotion={isReducedMotion}
			items={tableCurrentPageItems}
			onPageChange={handleTablePageChange}
			onSortChange={handleTableSortChange}
			page={tableCurrentPage}
			renderCell={renderTableCell}
			selectedKeys={tableSelectedKeys}
			sortDescriptor={tableSortDescriptor as SortDescriptor}
			topContent={tableToolbar}
			totalPages={tableTotalPages}
		/>
	);
}
