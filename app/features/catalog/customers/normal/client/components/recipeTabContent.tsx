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

import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import RecipeTableActionButton from '@/features/catalog/customers/shared/client/components/recipeTableActionButton';
import RecipeTableShell from '@/features/catalog/customers/shared/client/components/recipeTableShell';
import TagGroup from '@/features/catalog/customers/shared/client/components/tagGroup';
import type { TRecipeSuitabilityRow } from '@/features/catalog/customers/shared/contracts';
import {
	type ITableSortDescriptor,
	type TRecipeTableColumnKey,
	type TRecipeTableSortKey,
	recipeTableColumns,
} from '@/features/catalog/customers/shared/state/tableDescriptors';
import { CUSTOMER_NORMAL_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

export default function RecipeTabContent() {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const { isHighAppearance } = useDesignPreferences();

	const currentCustomerName = customerNormalStore.shared.customer.name.use();
	const selectedCustomerRecipeTag =
		customerNormalStore.shared.customer.select.recipeTag.use();

	const currentRecipeData = customerNormalStore.shared.recipe.data.use();
	const selectedCookers = customerNormalStore.recipeTableCookers.use();
	const selectedAvailabilityDlcs =
		customerNormalStore.recipeTableAvailabilityDlcs.use();

	const availableRecipeCookers =
		customerNormalStore.availableRecipeCookers.use();
	const availableRecipeAvailabilityDlcs =
		customerNormalStore.availableRecipeAvailabilityDlcs.use();
	const availableRecipeNames = customerNormalStore.availableRecipeNames.use();
	const availableRecipeTags = customerNormalStore.availableRecipeTags.use();

	const searchValue = customerNormalStore.shared.recipe.searchValue.use();

	const tableCurrentPage = customerNormalStore.shared.recipe.table.page.use();
	const tableRowsPerPage = customerNormalStore.shared.recipe.table.rows.use();
	const tableSelectableRows =
		customerNormalStore.shared.recipe.table.selectableRows.get();
	const tableSortDescriptor =
		customerNormalStore.persistence.recipe.table.sortDescriptor.use();
	const tableVisibleColumns =
		customerNormalStore.shared.recipe.table.columns.use();

	const {
		pagedRows: tableCurrentPageItems,
		sortedRows: tableSortedRows,
		totalPages: tableTotalPages,
	} = customerNormalStore.recipeTableRows.use();

	const tableHeaderColumns = useMemo(
		() =>
			recipeTableColumns.filter(({ key }) =>
				tableVisibleColumns.has(key)
			),
		[tableVisibleColumns]
	);

	const tableSelectedKeys = new Set(
		currentRecipeData === null ? [] : [currentRecipeData.recipeId]
	);

	const renderTableCell = useCallback(
		(
			recipeData: TRecipeSuitabilityRow,
			columnKey: TRecipeTableColumnKey
		) => {
			const {
				cookTime,
				cooker,
				ingredients,
				matchedPositiveTags,
				name,
				positiveTags,
				price,
				recipeId,
				suitability,
			} = recipeData;

			if (currentCustomerName === null) {
				return null;
			}

			const { positive: positiveTagStyle } = CUSTOMER_NORMAL_TAG_STYLE;

			const tags = (
				<TagGroup>
					{positiveTags.toSorted(pinyinSort).map((tag, index) => {
						const isPositiveTagMatched =
							matchedPositiveTags.includes(tag);
						const tagStyle = isPositiveTagMatched
							? positiveTagStyle
							: {};
						const tagType = isPositiveTagMatched
							? 'positive'
							: null;
						return (
							<Tags.Tag
								key={index}
								tag={tag}
								tagStyle={tagStyle}
								tagType={tagType}
								className={cn({
									'opacity-50': !isPositiveTagMatched,
								})}
							/>
						);
					})}
				</TagGroup>
			);

			switch (columnKey) {
				case 'recipe': {
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
									target="recipe"
									name={name}
									size={2}
									onPress={() => {
										openWindow('recipes', name);
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
				case 'cooker':
					return (
						<div className="flex">
							<Tooltip
								showArrow
								content={cooker}
								placement="left"
								size="sm"
							>
								<Sprite
									target="cooker"
									name={cooker}
									size={1.5}
								/>
							</Tooltip>
						</div>
					);
				case 'ingredient':
					return (
						<div className="flex flex-nowrap">
							{ingredients.map((ingredient, index) => {
								const ingredientLabel = `点击：在新窗口中查看食材【${ingredient}】的详情`;
								return (
									<Tooltip
										key={index}
										showArrow
										content={ingredientLabel}
										size="sm"
									>
										<Sprite
											target="ingredient"
											name={ingredient}
											size={1.5}
											onPress={() => {
												openWindow(
													'ingredients',
													ingredient
												);
											}}
											aria-label={ingredientLabel}
											role="button"
										/>
									</Tooltip>
								);
							})}
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
						<RecipeTableActionButton
							ingredients={ingredients}
							onSelect={() => {
								vibrate();
								customerNormalStore.onRecipeTableAction(
									name,
									recipeId
								);
							}}
						/>
					);
			}
		},
		[currentCustomerName, openWindow, vibrate]
	);

	const tableToolbar = useMemo(
		() => (
			<div className="flex flex-col gap-2">
				<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
					<div className="flex flex-1 items-end gap-3">
						<Autocomplete
							allowsCustomValue
							defaultItems={availableRecipeNames}
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
								customerNormalStore.onRecipeTableSearchValueChange(
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
							{({ value }) => (
								<AutocompleteItem
									key={value}
									textValue={value}
									classNames={{
										base: '[&>span+span]:hidden [&>span]:inline-flex',
									}}
								>
									<span className="inline-flex items-center">
										<Sprite
											target="recipe"
											name={value}
											size={1}
										/>
										<span className="ml-1">{value}</span>
									</span>
								</AutocompleteItem>
							)}
						</Autocomplete>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={availableRecipeTags}
							placeholder="标签"
							selectedKeys={selectedCustomerRecipeTag}
							size="sm"
							startContent={<FontAwesomeIcon icon={faTags} />}
							variant="flat"
							onSelectionChange={
								customerNormalStore.onRecipeTableSelectedPositiveTagsChange
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
								<SelectItem key={value}>{value}</SelectItem>
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
													selectedCookers
												),
										}
									)}
								>
									厨具
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								closeOnSelect={false}
								items={availableRecipeCookers}
								selectedKeys={selectedCookers}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={
									customerNormalStore.onRecipeTableSelectedCookersChange
								}
								aria-label="选择目标料理所使用的厨具"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
							>
								{({ value }) => (
									<DropdownItem key={value} textValue={value}>
										<div className="flex items-center">
											<Sprite
												target="cooker"
												name={value}
												size={1}
											/>
											<span className="ml-1">
												{value}
											</span>
										</div>
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
						{availableRecipeAvailabilityDlcs.length > 1 && (
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
									items={availableRecipeAvailabilityDlcs}
									selectedKeys={selectedAvailabilityDlcs}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={
										customerNormalStore.onRecipeTableSelectedAvailabilityDlcsChange
									}
									aria-label="按可获取内容筛选料理"
									itemClasses={{
										base: 'transition-background motion-reduce:transition-none',
									}}
								>
									{({ value }) => (
										<DropdownItem
											key={value}
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
								disabledKeys={
									[
										'action',
										'recipe',
									] satisfies TRecipeTableColumnKey[]
								}
								items={recipeTableColumns}
								selectedKeys={tableVisibleColumns}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={
									globalStore.recipeTableColumns.set
								}
								aria-label="选择表格所显示的列"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
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
									key={value}
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
			availableRecipeCookers,
			availableRecipeAvailabilityDlcs,
			availableRecipeNames,
			availableRecipeTags,
			isHighAppearance,
			isReducedMotion,
			popoverMotionProps,
			searchValue,
			selectedAvailabilityDlcs,
			selectedCookers,
			selectedCustomerRecipeTag,
			tableSortedRows.length,
			tableRowsPerPage,
			tableSelectableRows,
			tableVisibleColumns,
			vibrate,
		]
	);

	return (
		<RecipeTableShell
			headerColumns={tableHeaderColumns}
			isHighAppearance={isHighAppearance}
			isReducedMotion={isReducedMotion}
			items={tableCurrentPageItems}
			onPageChange={(page) => {
				vibrate();
				customerNormalStore.onRecipeTablePageChange(page);
			}}
			onSortChange={(config) => {
				vibrate();
				customerNormalStore.onRecipeTableSortChange(
					config as ITableSortDescriptor<TRecipeTableSortKey>
				);
			}}
			page={tableCurrentPage}
			renderCell={renderTableCell}
			selectedKeys={tableSelectedKeys}
			sortDescriptor={tableSortDescriptor as SortDescriptor}
			topContent={tableToolbar}
			totalPages={tableTotalPages}
		/>
	);
}
