import {type Key, forwardRef, memo, useCallback, useMemo} from 'react';
import clsx from 'clsx/lite';
import {cloneDeep} from 'lodash';

import {
	Autocomplete,
	AutocompleteItem,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Pagination,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	type Selection,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faMagnifyingGlass, faPlus, faTags} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {customerTagStyleMap, recipeTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TRecipeWithSuitability, TRecipesWithSuitability} from './types';
import {useCustomerRareStore, useGlobalStore} from '@/stores';
import {numberSort, pinyinSort} from '@/utils';

type TTableColumnKey = 'recipe' | 'cooker' | 'ingredient' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'cooker' | 'ingredient' | 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function RecipeTabContent(_props, ref) {
		const customerStore = useCustomerRareStore();
		const globalStore = useGlobalStore();

		const currentCustomer = customerStore.shared.customer.data.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const selectedCustomerPositiveTags = customerStore.shared.customer.positiveTags.use();

		const currentRecipe = customerStore.shared.recipe.data.use();
		const selectedDlcs = customerStore.shared.recipe.dlcs.use();
		const selectedCookers = customerStore.shared.recipe.cookers.use();

		const currentGlobalPopular = globalStore.persistence.popular.use();

		const instance_rare = customerStore.instances.customer_rare.get();
		const instance_special = customerStore.instances.customer_special.get();
		const instance_recipe = customerStore.instances.recipe.get();

		const allRecipeDlcs = customerStore.recipe.dlcs.get();
		const allRecipeNames = customerStore.recipe.names.get();
		const allRecipeTags = customerStore.recipe.positiveTags.get();
		const allCookers = customerStore.recipe.cookers.get();

		const searchValue = customerStore.shared.recipe.searchValue.use();
		const hasNameFilter = Boolean(searchValue);

		const tableCurrentPage = customerStore.shared.recipe.page.use();
		const tableRowsPerPage = customerStore.recipeTableRows.use();
		const tableRowsPerPageNumber = customerStore.persistence.recipe.table.rows.use();
		const tableSelectableRows = customerStore.shared.recipe.selectableRows.get();
		const tableSortDescriptor = customerStore.shared.recipe.sortDescriptor.use();
		const tableVisibleColumns = customerStore.recipeTableColumns.use();

		const filteredData = useMemo(() => {
			let clonedData = cloneDeep(instance_recipe.data) as TRecipesWithSuitability;

			if (!currentCustomer) {
				return clonedData.map((item) => ({
					...item,
					matchedNegativeTags: [] as string[],
					matchedPositiveTags: [] as string[],
					suitability: 0,
				}));
			}

			const {target, name: customerName} = currentCustomer;

			const instance_customer = (
				target === 'customer_rare' ? instance_rare : instance_special
			) as typeof instance_rare;

			const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} =
				instance_customer.getPropsByName(customerName);

			clonedData = clonedData.map((item) => {
				const composedRecipeTags = instance_recipe.composeTags(item.ingredients, [], item.positiveTags, []);
				const recipeTagsWithPopular = instance_recipe.calculateTagsWithPopular(
					composedRecipeTags,
					currentCustomerPopular
				);

				const {
					suitability,
					negativeTags: matchedNegativeTags,
					positiveTags: matchedPositiveTags,
				} = instance_recipe.getCustomerSuitability(
					recipeTagsWithPopular,
					customerPositiveTags,
					customerNegativeTags
				);

				return {
					...item,
					matchedNegativeTags,
					matchedPositiveTags,
					suitability,
				};
			});

			if (
				!hasNameFilter &&
				(selectedDlcs === 'all' || selectedDlcs.size === 0) &&
				(selectedCookers === 'all' || selectedCookers.size === 0) &&
				(selectedCustomerPositiveTags === 'all' || selectedCustomerPositiveTags.size === 0)
			) {
				return clonedData;
			}

			return clonedData.filter(({name, dlc, cooker, positiveTags}) => {
				const recipeTagsWithPopular = instance_recipe.calculateTagsWithPopular(
					positiveTags,
					currentCustomerPopular
				);

				const isNameMatched = hasNameFilter ? name.toLowerCase().includes(searchValue.toLowerCase()) : true;
				const isDlcMatched =
					selectedDlcs !== 'all' && selectedDlcs.size > 0 ? selectedDlcs.has(dlc.toString()) : true;
				const isCookerMatched =
					selectedCookers !== 'all' && selectedCookers.size > 0 ? selectedCookers.has(cooker) : true;
				const isPositiveTagsMatched =
					selectedCustomerPositiveTags !== 'all' && selectedCustomerPositiveTags.size > 0
						? [...selectedCustomerPositiveTags].every((tag) =>
								(recipeTagsWithPopular as string[]).includes(tag as string)
							)
						: true;

				return isNameMatched && isDlcMatched && isCookerMatched && isPositiveTagsMatched;
			});
		}, [
			currentCustomer,
			currentCustomerPopular,
			hasNameFilter,
			instance_rare,
			instance_recipe,
			instance_special,
			searchValue,
			selectedCookers,
			selectedCustomerPositiveTags,
			selectedDlcs,
		]);

		const sortedData = useMemo(() => {
			const {column, direction} = tableSortDescriptor;
			const isAscending = direction === 'ascending';

			switch (column) {
				case 'recipe':
					return cloneDeep(filteredData).sort(({name: a}, {name: b}) =>
						isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
					);
				case 'price':
					return cloneDeep(filteredData).sort(({price: a}, {price: b}) =>
						isAscending ? numberSort(a, b) : numberSort(b, a)
					);
				case 'suitability':
					return cloneDeep(filteredData).sort(({suitability: a}, {suitability: b}) =>
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

		const tableHeaderColumns = useMemo(() => {
			if (tableVisibleColumns === 'all') {
				return tableColumns;
			}

			return tableColumns.filter(({key}) => tableVisibleColumns.has(key));
		}, [tableVisibleColumns]);

		const tableTotalPages = useMemo(
			() => Math.ceil(filteredData.length / tableRowsPerPageNumber),
			[filteredData.length, tableRowsPerPageNumber]
		);

		const tableSelectedKeys = new Set([currentRecipe?.name ?? '']);

		const renderTableCell = useCallback(
			(data: TRecipeWithSuitability, columnKey: TTableColumnKey) => {
				const {
					name,
					cooker,
					ingredients,
					positiveTags,
					price,
					suitability,
					matchedNegativeTags,
					matchedPositiveTags,
				} = data;

				if (!currentCustomer) {
					return null;
				}

				const composedRecipeTags = instance_recipe.composeTags(ingredients, [], positiveTags, []);
				const recipeTagsWithPopular = instance_recipe.calculateTagsWithPopular(
					composedRecipeTags,
					currentCustomerPopular
				);
				const {positive: positiveTagStyle, negative: negativeTagStyle} =
					customerTagStyleMap[currentCustomer.target];

				const tags = (
					<TagGroup>
						{recipeTagsWithPopular.sort(pinyinSort).map((tag) => (
							<Tags.Tag
								key={tag}
								tag={tag}
								tagStyle={
									matchedPositiveTags.includes(tag)
										? positiveTagStyle
										: matchedNegativeTags.includes(tag)
											? negativeTagStyle
											: {}
								}
								className={clsx(
									![...matchedPositiveTags, ...matchedNegativeTags].includes(tag) && 'opacity-50'
								)}
							/>
						))}
					</TagGroup>
				);

				switch (columnKey) {
					case 'recipe':
						return (
							<div className="flex items-center">
								<Sprite target="recipe" name={name} size={2} className="mr-2" />
								<div className="inline-flex flex-1 items-center text-nowrap break-keep">
									<span className="text-small font-medium">{name}</span>
									<span className="-ml-2">
										<Popover showArrow>
											<Tooltip showArrow content={tags} offset={-2} placement="right">
												<span className="cursor-pointer underline decoration-dotted">
													<PopoverTrigger>
														<FontAwesomeIconButton
															icon={faTags}
															variant="light"
															aria-label="料理标签"
															className="inline h-4 w-4 scale-75 text-default-400 data-[hover]:bg-transparent"
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
					case 'cooker':
						return (
							<div className="flex">
								<Sprite target="cooker" name={cooker} size={2} />
							</div>
						);
					case 'ingredient':
						return (
							<div className="flex flex-nowrap">
								{ingredients.map((ingredient, index) => (
									<Sprite key={index} target="ingredient" name={ingredient} size={2} />
								))}
							</div>
						);
					case 'price':
						return <div className="flex">￥{price}</div>;
					case 'suitability':
						return <div className="flex">{suitability}</div>;
					case 'action':
						return (
							<div className="flex justify-center">
								<Tooltip showArrow content="选择此项" placement="left">
									<Button
										isIconOnly
										size="sm"
										variant="light"
										onPress={() => {
											customerStore.shared.customer.popular.set(currentGlobalPopular);
											customerStore.shared.recipe.data.set({
												extraIngredients: [],
												name,
											});
											trackEvent(TrackCategory.Select, 'Recipe', name);
										}}
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[
				currentCustomer,
				instance_recipe,
				currentCustomerPopular,
				customerStore.shared.customer.popular,
				customerStore.shared.recipe.data,
				currentGlobalPopular,
			]
		);

		const onSelectedDlcsChange = useCallback(
			(value: Selection) => {
				customerStore.shared.recipe.dlcs.set(value);
				customerStore.shared.recipe.page.set(1);
			},
			[customerStore.shared.recipe.dlcs, customerStore.shared.recipe.page]
		);

		const onSelectedCookersChange = useCallback(
			(value: Selection) => {
				customerStore.shared.recipe.cookers.set(value);
				customerStore.shared.recipe.page.set(1);
			},
			[customerStore.shared.recipe.cookers, customerStore.shared.recipe.page]
		);

		const onSelectedPositiveTagsChange = useCallback(
			(value: Selection) => {
				customerStore.shared.customer.positiveTags.set(value);
				customerStore.shared.recipe.page.set(1);
			},
			[customerStore.shared.customer.positiveTags, customerStore.shared.recipe.page]
		);

		const onSearchValueChange = useCallback(
			(value: Key | null) => {
				if (value) {
					customerStore.shared.recipe.searchValue.set(value as string);
					customerStore.shared.recipe.page.set(1);
				} else {
					customerStore.shared.recipe.searchValue.set('');
				}
			},
			[customerStore.shared.recipe.page, customerStore.shared.recipe.searchValue]
		);

		const onSearchValueClear = useCallback(() => {
			customerStore.shared.recipe.searchValue.set('');
			customerStore.shared.recipe.page.set(1);
		}, [customerStore.shared.recipe.page, customerStore.shared.recipe.searchValue]);

		const onTableRowsPerPageChange = useCallback(
			(value: Selection) => {
				customerStore.recipeTableRows.set(value);
				customerStore.shared.recipe.page.set(1);
			},
			[customerStore.recipeTableRows, customerStore.shared.recipe.page]
		);

		const tableToolbar = useMemo(
			() => (
				<div className="flex flex-col gap-2">
					<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
						<div className="flex flex-1 gap-3">
							<Autocomplete
								allowsCustomValue
								defaultInputValue={searchValue}
								defaultItems={allRecipeNames}
								placeholder="名称"
								size="sm"
								startContent={<FontAwesomeIcon icon={faMagnifyingGlass} />}
								variant="flat"
								onClear={onSearchValueClear}
								onInputChange={onSearchValueChange}
								onSelectionChange={onSearchValueChange}
								aria-label="选择或输入料理名称"
								title="选择或输入料理名称"
							>
								{({value}) => <AutocompleteItem key={value}>{value}</AutocompleteItem>}
							</Autocomplete>
							<Select
								items={allRecipeTags}
								defaultSelectedKeys={selectedCustomerPositiveTags}
								selectedKeys={selectedCustomerPositiveTags}
								selectionMode="multiple"
								placeholder="标签"
								size="sm"
								startContent={<FontAwesomeIcon icon={faTags} />}
								variant="flat"
								onSelectionChange={onSelectedPositiveTagsChange}
								aria-label="选择目标料理所包含的标签"
								title="选择目标料理所包含的标签"
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
										variant="flat"
									>
										厨具
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									closeOnSelect={false}
									items={allCookers}
									defaultSelectedKeys={selectedCookers}
									selectedKeys={selectedCookers}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={onSelectedCookersChange}
									aria-label="选择目标料理所使用的厨具"
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
										variant="flat"
									>
										DLC
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									closeOnSelect={false}
									items={allRecipeDlcs}
									defaultSelectedKeys={selectedDlcs}
									selectedKeys={selectedDlcs}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={onSelectedDlcsChange}
									aria-label="选择特定DLC中的料理"
								>
									{({value}) => (
										<DropdownItem key={value} textValue={value.toString()}>
											{value}
										</DropdownItem>
									)}
								</DropdownMenu>
							</Dropdown>
							<Dropdown showArrow>
								<DropdownTrigger>
									<Button
										endContent={<FontAwesomeIcon icon={faChevronDown} />}
										size="sm"
										variant="flat"
									>
										条目
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									closeOnSelect={false}
									disallowEmptySelection
									defaultSelectedKeys={tableVisibleColumns}
									disabledKeys={['action', 'recipe'] satisfies TTableColumnKey[]}
									selectedKeys={tableVisibleColumns}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={customerStore.recipeTableColumns.set}
									aria-label="选择表格所显示的列"
								>
									{tableColumns.map(({label: name, key}) => (
										<DropdownItem key={key}>{name}</DropdownItem>
									))}
								</DropdownMenu>
							</Dropdown>
						</div>
					</div>
					<div className="flex items-center justify-between text-small text-default-400">
						<span>总计{filteredData.length}道料理</span>
						<label className="flex items-center">
							<span className="mr-2 cursor-auto text-nowrap break-keep">表格行数</span>
							<Select
								items={tableSelectableRows}
								defaultSelectedKeys={tableRowsPerPage}
								selectedKeys={tableRowsPerPage}
								size="sm"
								variant="flat"
								onSelectionChange={onTableRowsPerPageChange}
								aria-label="选择表格每页最大行数"
								title="选择表格每页最大行数"
								classNames={{
									base: 'min-w-16',
									popoverContent: 'min-w-20',
									trigger: 'h-6 min-h-6',
									value: '!text-default-400',
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
				customerStore.recipeTableColumns.set,
				filteredData.length,
				onSearchValueChange,
				onSearchValueClear,
				onSelectedCookersChange,
				onSelectedDlcsChange,
				onSelectedPositiveTagsChange,
				onTableRowsPerPageChange,
				searchValue,
				selectedCookers,
				selectedCustomerPositiveTags,
				selectedDlcs,
				tableRowsPerPage,
				tableSelectableRows,
				tableVisibleColumns,
			]
		);

		const tablePagination = useMemo(
			() => (
				<div className="flex justify-center">
					<Pagination
						isCompact
						loop
						showControls
						showShadow
						size="sm"
						page={tableCurrentPage}
						total={tableTotalPages}
						onChange={customerStore.shared.recipe.page.set}
					/>
				</div>
			),
			[customerStore.shared.recipe.page.set, tableCurrentPage, tableTotalPages]
		);

		return (
			<Table
				isHeaderSticky
				bottomContent={tablePagination}
				bottomContentPlacement="outside"
				selectedKeys={tableSelectedKeys}
				selectionMode="single"
				sortDescriptor={tableSortDescriptor}
				topContent={tableToolbar}
				topContentPlacement="outside"
				onSortChange={(config) => {
					customerStore.shared.recipe.sortDescriptor.set(config as TTableSortDescriptor);
				}}
				aria-label="料理选择表格"
				classNames={{
					wrapper: 'max-h-[calc(100vh-17.5rem)]',
				}}
				ref={ref}
			>
				<TableHeader columns={tableHeaderColumns}>
					{({key, label, sortable}) => (
						<TableColumn key={key} align={key === 'action' ? 'center' : 'start'} allowsSorting={sortable}>
							{label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody emptyContent="数据为空" items={tableCurrentPageItems}>
					{(item) => (
						<TableRow key={item.name}>
							{(columnKey) => (
								<TableCell>{renderTableCell(item, columnKey as TTableColumnKey)}</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>
		);
	})
);
