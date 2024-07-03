import {type Key, forwardRef, memo, useCallback, useMemo} from 'react';
import clsx from 'clsx';
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
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {recipeTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TRecipeWithSuitability, TRecipesWithSuitability} from './types';
import {CUSTOMER_NORMAL_TAG_STYLE} from '@/constants';
import {useCustomerNormalStore} from '@/stores';
import {numberSort, pinyinSort} from '@/utils';

type TTableColumnKey = 'recipe' | 'kitchenware' | 'ingredient' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'kitchenware' | 'ingredient' | 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function RecipeTabContent(_props, ref) {
		const store = useCustomerNormalStore();

		const currentCustomerName = store.shared.customer.name.use();
		const selectedCustomerPositiveTags = store.shared.customer.positiveTags.use();

		const currentRecipe = store.shared.recipe.data.use();
		const selectedDlcs = store.shared.recipe.dlcs.use();
		const selectedKitchenwares = store.shared.recipe.kitchenwares.use();

		const instance_recipe = store.instances.recipe.get();

		const allRecipeDlcs = store.recipe.dlcs.get();
		const allRecipeNames = store.recipe.names.get();
		const allRecipePositiveTags = store.recipe.positiveTags.get();
		const allKitchenwares = store.recipe.kitchenwares.get();

		const searchValue = store.shared.recipe.searchValue.use();
		const hasNameFilter = useMemo(() => Boolean(searchValue), [searchValue]);

		const tableCurrentPage = store.shared.recipe.page.use();
		const tableRowsPerPage = store.recipeTableRows.use();
		const tableRowsPerPageNumber = store.persistence.recipe.table.rows.use();
		const tableSelectableRows = store.shared.recipe.selectableRows.get();
		const tableSortDescriptor = store.shared.recipe.sortDescriptor.use();
		const tableVisibleColumns = store.recipeTableColumns.use();

		const filteredData = useMemo(() => {
			let clonedData = cloneDeep(instance_recipe.data) as TRecipesWithSuitability;

			if (!currentCustomerName) {
				return clonedData.map((item) => ({
					...item,
					matchedNegativeTags: [] as string[],
					matchedPositiveTags: [] as string[],
					suitability: 0,
				}));
			}

			const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} = store.instances.customer
				.get()
				.getPropsByName(currentCustomerName);

			clonedData = clonedData.map((item) => {
				const {
					suitability,
					negativeTags: matchedNegativeTags,
					positiveTags: matchedPositiveTags,
				} = instance_recipe.getCustomerSuitability(item.name, customerPositiveTags, customerNegativeTags);

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
				(selectedKitchenwares === 'all' || selectedKitchenwares.size === 0) &&
				(selectedCustomerPositiveTags === 'all' || selectedCustomerPositiveTags.size === 0)
			) {
				return clonedData;
			}

			return clonedData.filter(({name, dlc, kitchenware, positiveTags}) => {
				const isNameMatch = hasNameFilter ? name.toLowerCase().includes(searchValue.toLowerCase()) : true;
				const isDlcMatch =
					selectedDlcs !== 'all' && selectedDlcs.size > 0 ? selectedDlcs.has(dlc.toString()) : true;
				const isKitchenwareMatch =
					selectedKitchenwares !== 'all' && selectedKitchenwares.size > 0
						? selectedKitchenwares.has(kitchenware)
						: true;
				const isPositiveTagsMatch =
					selectedCustomerPositiveTags !== 'all' && selectedCustomerPositiveTags.size > 0
						? [...selectedCustomerPositiveTags].every((tag) =>
								(positiveTags as string[]).includes(tag as string)
							)
						: true;

				return isNameMatch && isDlcMatch && isKitchenwareMatch && isPositiveTagsMatch;
			});
		}, [
			currentCustomerName,
			hasNameFilter,
			instance_recipe,
			searchValue,
			selectedCustomerPositiveTags,
			selectedDlcs,
			selectedKitchenwares,
			store.instances,
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

		const tabelSelectedKeys = useMemo(() => new Set([currentRecipe?.name ?? '']), [currentRecipe?.name]);

		const renderTableCell = useCallback(
			(data: TRecipeWithSuitability, columnKey: TTableColumnKey) => {
				const {
					name,
					kitchenware,
					ingredients,
					positiveTags,
					price,
					suitability,
					matchedNegativeTags,
					matchedPositiveTags,
				} = data;

				if (!currentCustomerName) {
					return null;
				}

				const {positive: positiveTagStyle, negative: negativeTagStyle} = CUSTOMER_NORMAL_TAG_STYLE;

				const tags = (
					<TagGroup>
						{[...positiveTags].sort(pinyinSort).map((tag) => (
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
									<p className="text-small font-medium">{name}</p>
									<div className="-ml-2">
										<Popover showArrow>
											<Tooltip showArrow content={tags} offset={0}>
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
									</div>
								</div>
							</div>
						);
					case 'kitchenware':
						return (
							<div className="flex">
								<Sprite target="kitchenware" name={kitchenware} size={2} />
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
								<Tooltip showArrow content="选择此项" offset={0}>
									<Button
										isIconOnly
										size="sm"
										variant="light"
										onPress={() => {
											store.shared.recipe.data.set({
												extraIngredients: [],
												name,
											});
										}}
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[currentCustomerName, store.shared.recipe.data]
		);

		const onSelectedDlcsChange = useCallback(
			(value: Selection) => {
				store.shared.recipe.dlcs.set(value);
				store.shared.recipe.page.set(1);
			},
			[store.shared.recipe.dlcs, store.shared.recipe.page]
		);

		const onSelectedKitchenwaresChange = useCallback(
			(value: Selection) => {
				store.shared.recipe.kitchenwares.set(value);
				store.shared.recipe.page.set(1);
			},
			[store.shared.recipe.kitchenwares, store.shared.recipe.page]
		);

		const onSelectedPositiveTagsChange = useCallback(
			(value: Selection) => {
				store.shared.customer.positiveTags.set(value);
				store.shared.recipe.page.set(1);
			},
			[store.shared.customer.positiveTags, store.shared.recipe.page]
		);

		const onSearchValueChange = useCallback(
			(value: Key | null) => {
				if (value) {
					store.shared.recipe.searchValue.set(value as string);
					store.shared.recipe.page.set(1);
				} else {
					store.shared.recipe.searchValue.set('');
				}
			},
			[store.shared.recipe.page, store.shared.recipe.searchValue]
		);

		const onSearchValueClear = useCallback(() => {
			store.shared.recipe.searchValue.set('');
			store.shared.recipe.page.set(1);
		}, [store.shared.recipe.page, store.shared.recipe.searchValue]);

		const onTableRowsPerPageChange = useCallback(
			(value: Selection) => {
				store.recipeTableRows.set(value);
				store.shared.recipe.page.set(1);
			},
			[store.recipeTableRows, store.shared.recipe.page]
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
								items={allRecipePositiveTags}
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
									items={allKitchenwares}
									defaultSelectedKeys={selectedKitchenwares}
									selectedKeys={selectedKitchenwares}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={onSelectedKitchenwaresChange}
									aria-label="选择目标料理所使用的厨具"
								>
									{({value}) => (
										<DropdownItem key={value} textValue={value}>
											<div className="flex items-center">
												<Sprite target="kitchenware" name={value} size={1} />
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
									onSelectionChange={store.recipeTableColumns.set}
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
				allKitchenwares,
				allRecipeDlcs,
				allRecipeNames,
				allRecipePositiveTags,
				filteredData.length,
				onSearchValueChange,
				onSearchValueClear,
				onSelectedDlcsChange,
				onSelectedKitchenwaresChange,
				onSelectedPositiveTagsChange,
				onTableRowsPerPageChange,
				searchValue,
				selectedCustomerPositiveTags,
				selectedDlcs,
				selectedKitchenwares,
				store.recipeTableColumns.set,
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
						onChange={store.shared.recipe.page.set}
					/>
				</div>
			),
			[store.shared.recipe.page.set, tableCurrentPage, tableTotalPages]
		);

		return (
			<Table
				isHeaderSticky
				bottomContent={tablePagination}
				bottomContentPlacement="outside"
				selectedKeys={tabelSelectedKeys}
				selectionMode="single"
				sortDescriptor={tableSortDescriptor}
				topContent={tableToolbar}
				topContentPlacement="outside"
				onSortChange={(config) => {
					store.shared.recipe.sortDescriptor.set(config as TTableSortDescriptor);
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
				<TableBody emptyContent={'数据为空'} items={tableCurrentPageItems}>
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
