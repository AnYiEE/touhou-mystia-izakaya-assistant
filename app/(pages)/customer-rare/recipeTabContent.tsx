import {useCallback, useMemo} from 'react';
import {curry, curryRight} from 'lodash';

import {useVibrate, useViewInNewWindow} from '@/hooks';

import {Autocomplete, AutocompleteItem} from '@nextui-org/autocomplete';
import {Pagination} from '@nextui-org/pagination';
import {Select, SelectItem} from '@nextui-org/select';
import {type SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@nextui-org/table';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faMagnifyingGlass, faPlus, faTags} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
	useMotionProps,
	useReducedMotion,
} from '@/design/ui/components';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Placeholder from '@/components/placeholder';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {recipeTableColumns as tableColumns} from './constants';
import {checkRecipeEasterEgg} from './evaluateMeal';
import type {ITableColumn, ITableSortDescriptor, TRecipeWithSuitability, TRecipesWithSuitability} from './types';
import {CUSTOMER_RARE_TAG_STYLE, LABEL_DLC_0} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkArraySubsetOf, copyArray, numberSort, pinyinSort, processPinyin, toArray, toSet} from '@/utilities';

export type TTableColumnKey = 'recipe' | 'cooker' | 'ingredient' | 'price' | 'suitability' | 'time' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'cooker' | 'ingredient' | 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

export default function RecipeTabContent() {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerPopularTrend = customerStore.shared.customer.popularTrend.use();
	const selectedCustomerRecipeTag = customerStore.shared.customer.select.recipeTag.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();

	const currentRecipeData = customerStore.shared.recipe.data.use();
	const selectedCookers = customerStore.recipeTableCookers.use();
	const selectedDlcs = customerStore.recipeTableDlcs.use();

	const instance_customer = customerStore.instances.customer.get();
	const instance_recipe = customerStore.instances.recipe.get();

	const allRecipeDlcs = customerStore.recipe.dlcs.get();
	const allRecipeNames = customerStore.recipe.names.get();
	const allRecipeTags = customerStore.recipe.tags.get();
	const allCookers = customerStore.recipe.cookers.get();

	const searchValue = customerStore.shared.recipe.searchValue.use();
	const hasNameFilter = Boolean(searchValue);

	const tableCurrentPage = customerStore.shared.recipe.page.use();
	const tableRowsPerPage = customerStore.recipeTableRows.use();
	const tableRowsPerPageNumber = customerStore.persistence.recipe.table.rows.use();
	const tableSelectableRows = customerStore.shared.recipe.selectableRows.get();
	const tableSortDescriptor = customerStore.persistence.recipe.table.sortDescriptor.use();
	const tableVisibleColumns = customerStore.recipeTableColumns.use();

	const composeTagsWithPopularTrend = useMemo(
		() =>
			curry(instance_recipe.composeTagsWithPopularTrend)(
				curry.placeholder,
				[],
				curry.placeholder,
				[],
				currentCustomerPopularTrend
			),
		[currentCustomerPopularTrend, instance_recipe.composeTagsWithPopularTrend]
	);

	const calculateTagsWithTrend = useMemo(
		() => curryRight(instance_recipe.calculateTagsWithTrend)(currentCustomerPopularTrend, isFamousShop),
		[currentCustomerPopularTrend, instance_recipe.calculateTagsWithTrend, isFamousShop]
	);

	const data = useMemo(
		() =>
			instance_recipe.data.filter(
				({name}) => !instance_recipe.blockedRecipes.has(name)
			) as TRecipesWithSuitability,
		[instance_recipe.blockedRecipes, instance_recipe.data]
	);

	const filteredData = useMemo(() => {
		if (currentCustomerName === null) {
			return data.map((item) => ({
				...item,
				matchedNegativeTags: [],
				matchedPositiveTags: [],
				suitability: 0,
			}));
		}

		const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} =
			instance_customer.getPropsByName(currentCustomerName);

		const dataWithRealSuitability = data.map((item) => {
			const composedRecipeTags = composeTagsWithPopularTrend(item.ingredients, item.positiveTags);
			const recipeTagsWithTrend = calculateTagsWithTrend(composedRecipeTags);

			const {recipe: easterEggRecipe, score: easterEggScore} = checkRecipeEasterEgg({
				currentCustomerName,
				currentRecipeName: item.name,
			});

			if (item.name === easterEggRecipe) {
				return {
					...item,
					matchedNegativeTags: [],
					matchedPositiveTags: [],
					suitability: easterEggScore > 0 ? Infinity : -Infinity,
				};
			}

			const {
				negativeTags: matchedNegativeTags,
				positiveTags: matchedPositiveTags,
				suitability,
			} = instance_recipe.getCustomerSuitability(recipeTagsWithTrend, customerPositiveTags, customerNegativeTags);

			return {
				...item,
				matchedNegativeTags,
				matchedPositiveTags,
				suitability,
			};
		});

		if (
			selectedCookers.size === 0 &&
			selectedCustomerRecipeTag.size === 0 &&
			selectedDlcs.size === 0 &&
			!hasNameFilter
		) {
			return dataWithRealSuitability;
		}

		const searchValueLowerCase = searchValue.toLowerCase();

		return dataWithRealSuitability.filter(({cooker, dlc, name, pinyin, positiveTags}) => {
			const {pinyinFirstLetters, pinyinWithoutTone} = processPinyin(pinyin);
			const recipeTagsWithTrend = calculateTagsWithTrend(positiveTags);

			const isNameMatched = hasNameFilter
				? name.toLowerCase().includes(searchValueLowerCase) ||
					pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
					pinyinFirstLetters.includes(searchValueLowerCase)
				: true;
			const isDlcMatched = selectedDlcs.size > 0 ? selectedDlcs.has(dlc.toString()) : true;
			const isCookerMatched = selectedCookers.size > 0 ? selectedCookers.has(cooker) : true;
			const isPositiveTagsMatched =
				selectedCustomerRecipeTag.size > 0
					? checkArraySubsetOf(toArray(selectedCustomerRecipeTag), recipeTagsWithTrend)
					: true;

			return isNameMatched && isDlcMatched && isCookerMatched && isPositiveTagsMatched;
		});
	}, [
		calculateTagsWithTrend,
		composeTagsWithPopularTrend,
		currentCustomerName,
		data,
		hasNameFilter,
		instance_customer,
		instance_recipe,
		searchValue,
		selectedCookers,
		selectedCustomerRecipeTag,
		selectedDlcs,
	]);

	const sortedData = useMemo(() => {
		const {column, direction} = tableSortDescriptor;
		const isAscending = direction === 'ascending';

		switch (column) {
			case 'recipe':
				return copyArray(filteredData).sort(({name: a}, {name: b}) =>
					isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
				);
			case 'price':
				return copyArray(filteredData).sort(({price: a}, {price: b}) =>
					isAscending ? numberSort(a, b) : numberSort(b, a)
				);
			case 'suitability':
				return copyArray(filteredData).sort(({suitability: a}, {suitability: b}) =>
					isAscending ? numberSort(a, b) : numberSort(b, a)
				);
			case 'time':
				return copyArray(filteredData).sort(({min: a}, {min: b}) =>
					isAscending ? numberSort(a, b) : numberSort(b, a)
				);
			default:
				return filteredData;
		}
	}, [filteredData, tableSortDescriptor]);

	const tableCurrentPageItems = useMemo(() => {
		const start = (tableCurrentPage - 1) * tableRowsPerPageNumber;
		const end = start + tableRowsPerPageNumber;

		return sortedData.slice(start, end);
	}, [sortedData, tableCurrentPage, tableRowsPerPageNumber]);

	const tableHeaderColumns = useMemo(
		() => tableColumns.filter(({key}) => tableVisibleColumns.has(key)),
		[tableVisibleColumns]
	);

	const tableTotalPages = Math.ceil(filteredData.length / tableRowsPerPageNumber);

	const tableSelectedKeys = toSet([currentRecipeData?.name ?? '']);

	const renderTableCell = useCallback(
		(recipeData: TRecipeWithSuitability, columnKey: TTableColumnKey) => {
			const {
				cooker,
				ingredients,
				matchedNegativeTags,
				matchedPositiveTags,
				max,
				min,
				name,
				positiveTags,
				price,
				suitability,
			} = recipeData;

			if (currentCustomerName === null) {
				return null;
			}

			const composedRecipeTags = composeTagsWithPopularTrend(ingredients, positiveTags);
			const recipeTagsWithTrend = calculateTagsWithTrend(composedRecipeTags);

			const {negative: negativeTagStyle, positive: positiveTagStyle} = CUSTOMER_RARE_TAG_STYLE;

			const tags = (
				<TagGroup>
					{recipeTagsWithTrend.sort(pinyinSort).map((tag, index) => {
						const isNegativeTagMatched = matchedNegativeTags.includes(tag);
						const isPositiveTagMatched = matchedPositiveTags.includes(tag);
						const isTagMatched = isNegativeTagMatched || isPositiveTagMatched;
						const tagStyle = isNegativeTagMatched
							? negativeTagStyle
							: isPositiveTagMatched
								? positiveTagStyle
								: {};
						const tagType = isNegativeTagMatched ? 'negative' : isPositiveTagMatched ? 'positive' : null;
						return (
							<Tags.Tag
								key={index}
								tag={tag}
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
				case 'recipe': {
					const label = `点击：在新窗口中查看料理【${name}】的详情`;
					return (
						<div className="flex items-center">
							<Tooltip showArrow content={label} placement="right" size="sm">
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
								<span className="text-small font-medium">{name}</span>
								<span className="ml-0.5">
									<Popover showArrow offset={10} size="sm">
										<Tooltip showArrow content={tags} offset={5} placement="right" size="sm">
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
							<Tooltip showArrow content={cooker} placement="left" size="sm">
								<Sprite target="cooker" name={cooker} size={1.5} />
							</Tooltip>
						</div>
					);
				case 'ingredient':
					return (
						<div className="flex flex-nowrap">
							{ingredients.map((ingredient, index) => {
								const ingredientLabel = `点击：在新窗口中查看食材【${ingredient}】的详情`;
								return (
									<Tooltip key={index} showArrow content={ingredientLabel} size="sm">
										<Sprite
											target="ingredient"
											name={ingredient}
											size={1.5}
											onPress={() => {
												openWindow('ingredients', ingredient);
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
							{suitability === Infinity || suitability === -Infinity ? (
								'固定评级'
							) : (
								<Price showSymbol={false}>{suitability}</Price>
							)}
						</div>
					);
				case 'time':
					return (
						<div className="flex">
							{min}
							<span className="mx-0.5">-</span>
							{max}秒
						</div>
					);
				case 'action': {
					const label = '点击：选择此项';
					return (
						<div className="flex justify-center">
							<Tooltip showArrow content={label} placement="left" size="sm">
								<Button
									isIconOnly
									size="sm"
									variant="light"
									onPress={() => {
										vibrate();
										customerStore.onRecipeTableAction(name);
									}}
									aria-label={label}
								>
									<FontAwesomeIcon icon={faPlus} />
								</Button>
							</Tooltip>
						</div>
					);
				}
			}
		},
		[calculateTagsWithTrend, composeTagsWithPopularTrend, currentCustomerName, openWindow, vibrate]
	);

	const tableToolbar = useMemo(
		() => (
			<div className="flex flex-col gap-2">
				<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
					<div className="flex flex-1 items-end gap-3">
						<Autocomplete
							allowsCustomValue
							defaultItems={allRecipeNames}
							disableAnimation={isReducedMotion}
							inputValue={searchValue}
							isVirtualized={false}
							placeholder="名称"
							size="sm"
							startContent={<FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none" />}
							variant="flat"
							onInputChange={(value) => {
								vibrate(!value);
								customerStore.onRecipeTableSearchValueChange(value);
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
									{
										'backdrop-blur': isHighAppearance,
									}
								),
								listboxWrapper:
									'[&_li]:transition-background data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
								popoverContent: cn({
									'bg-content1/70 backdrop-blur-lg': isHighAppearance,
								}),
							}}
						>
							{({value}) => (
								<AutocompleteItem
									key={value}
									textValue={value}
									classNames={{
										base: '[&>span+span]:hidden [&>span]:inline-flex',
									}}
								>
									<span className="inline-flex items-center">
										<Sprite target="recipe" name={value} size={1} />
										<span className="ml-1">{value}</span>
									</span>
								</AutocompleteItem>
							)}
						</Autocomplete>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={allRecipeTags}
							placeholder="标签"
							selectedKeys={selectedCustomerRecipeTag}
							size="sm"
							startContent={<FontAwesomeIcon icon={faTags} />}
							variant="flat"
							onSelectionChange={customerStore.onRecipeTableSelectedPositiveTagsChange}
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
									'bg-content1/70 backdrop-blur-lg': isHighAppearance,
								}),
								trigger: cn(
									'bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
									{
										'backdrop-blur': isHighAppearance,
									}
								),
							}}
						>
							{({value}) => <SelectItem key={value}>{value}</SelectItem>}
						</Select>
					</div>
					<div className="flex w-full gap-3 md:w-auto">
						<Dropdown showArrow>
							<DropdownTrigger>
								<Button
									endContent={<FontAwesomeIcon icon={faChevronDown} />}
									size="sm"
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{
											'backdrop-blur': isHighAppearance,
											'ring-2 ring-default': selectedCookers.size > 0,
										}
									)}
								>
									厨具
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								closeOnSelect={false}
								items={allCookers}
								selectedKeys={selectedCookers}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={customerStore.onRecipeTableSelectedCookersChange}
								aria-label="选择目标料理所使用的厨具"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
							>
								{({value}) => (
									<DropdownItem key={value} textValue={value}>
										<div className="flex items-center">
											<Sprite target="cooker" name={value} size={1} />
											<span className="ml-1">{value}</span>
										</div>
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
						<Dropdown showArrow>
							<DropdownTrigger>
								<Button
									endContent={<FontAwesomeIcon icon={faChevronDown} />}
									size="sm"
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{
											'backdrop-blur': isHighAppearance,
											'ring-2 ring-default': selectedDlcs.size > 0,
										}
									)}
								>
									DLC
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								closeOnSelect={false}
								items={allRecipeDlcs}
								selectedKeys={selectedDlcs}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={customerStore.onRecipeTableSelectedDlcsChange}
								aria-label="选择特定DLC中的料理"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
							>
								{({value}) => (
									<DropdownItem key={value} textValue={value.toString()}>
										{value || LABEL_DLC_0}
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
						<Dropdown showArrow>
							<DropdownTrigger>
								<Button
									endContent={<FontAwesomeIcon icon={faChevronDown} />}
									size="sm"
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{
											'backdrop-blur': isHighAppearance,
										}
									)}
								>
									条目
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								disallowEmptySelection
								closeOnSelect={false}
								disabledKeys={['action', 'recipe'] satisfies TTableColumnKey[]}
								items={tableColumns}
								selectedKeys={tableVisibleColumns}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={customerStore.recipeTableColumns.set}
								aria-label="选择表格所显示的列"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
							>
								{({key, label}) => <DropdownItem key={key}>{label}</DropdownItem>}
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>
				<div className="flex items-center justify-between text-small text-default-700">
					<span>总计{filteredData.length}道料理</span>
					<label className="flex items-center gap-2">
						<span className="cursor-auto whitespace-nowrap">表格行数</span>
						<Select
							disallowEmptySelection
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={tableSelectableRows}
							selectedKeys={tableRowsPerPage}
							size="sm"
							variant="flat"
							onSelectionChange={customerStore.onRecipeTableRowsPerPageChange}
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
									'bg-content1/70 backdrop-blur-lg': isHighAppearance,
								}),
								trigger: cn(
									'h-6 min-h-6 bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
									{
										'backdrop-blur': isHighAppearance,
									}
								),
								value: '!text-default-700',
							}}
						>
							{({value}) => (
								<SelectItem key={value} textValue={value.toString()}>
									{value}
								</SelectItem>
							)}
						</Select>
					</label>
				</div>
			</div>
		),
		[
			allCookers,
			allRecipeDlcs,
			allRecipeNames,
			allRecipeTags,
			filteredData.length,
			isHighAppearance,
			isReducedMotion,
			popoverMotionProps,
			searchValue,
			selectedCookers,
			selectedCustomerRecipeTag,
			selectedDlcs,
			tableRowsPerPage,
			tableSelectableRows,
			tableVisibleColumns,
			vibrate,
		]
	);

	const tablePagination = useMemo(
		() => (
			<div className="flex justify-center pt-2">
				{tableCurrentPageItems.length > 0 && (
					<Pagination
						/** @todo Add it back after {@link https://github.com/nextui-org/nextui/issues/4275} is fixed. */
						// showControls
						showShadow
						disableAnimation={isReducedMotion}
						size="sm"
						page={tableCurrentPage}
						total={tableTotalPages}
						onChange={(page) => {
							vibrate();
							customerStore.onRecipeTablePageChange(page);
						}}
						classNames={{
							item: cn('bg-default/40', {
								'backdrop-blur': isHighAppearance,
							}),
						}}
					/>
				)}
			</div>
		),
		[isHighAppearance, isReducedMotion, tableCurrentPage, tableCurrentPageItems.length, tableTotalPages, vibrate]
	);

	return (
		<Table
			isHeaderSticky
			bottomContent={tablePagination}
			bottomContentPlacement="outside"
			selectedKeys={tableSelectedKeys}
			selectionMode="single"
			sortDescriptor={tableSortDescriptor as SortDescriptor}
			topContent={tableToolbar}
			topContentPlacement="outside"
			onSortChange={(config) => {
				vibrate();
				customerStore.onRecipeTableSortChange(config as TTableSortDescriptor);
			}}
			aria-label="料理选择表格"
			classNames={{
				base: 'gap-2',
				td: 'before:bg-default-200/70 before:transition-colors-opacity motion-reduce:before:transition-none',
				th: cn('bg-default-200/70', {
					'backdrop-blur-sm': isHighAppearance,
				}),
				wrapper: cn('bg-content1/40 xl:max-h-[calc(var(--safe-h-dvh)-17.5rem)] xl:p-2', {
					'backdrop-blur': isHighAppearance,
				}),
			}}
		>
			<TableHeader columns={tableHeaderColumns}>
				{({key, label, sortable}) => (
					<TableColumn key={key} align={key === 'action' ? 'center' : 'start'} allowsSorting={sortable}>
						{label}
					</TableColumn>
				)}
			</TableHeader>
			<TableBody emptyContent={<Placeholder>数据为空</Placeholder>} items={tableCurrentPageItems}>
				{(item) => (
					<TableRow key={item.name}>
						{(columnKey) => <TableCell>{renderTableCell(item, columnKey as TTableColumnKey)}</TableCell>}
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
