import {forwardRef, memo, useCallback, useMemo, type ChangeEvent, type Key} from 'react';
import clsx from 'clsx';

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
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
	type Selection,
} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faMagnifyingGlass, faPlus, faTags} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {customerTagStyleMap, recipeTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TRecipeWithSuitability, TRecipesWithSuitability} from './types';
import {useCustomerRareStore, useRecipesStore} from '@/stores';
import {numberSort, pinyinSort} from '@/utils';

type TTableColumnKey = 'recipe' | 'kitchenware' | 'ingredient' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'kitchenware' | 'ingredient' | 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function RecipeTabContent(_props, ref) {
		const customerStore = useCustomerRareStore();
		const recipesStore = useRecipesStore();

		const currentCustomer = customerStore.share.customer.data.use();
		const selectedCustomerPositiveTags = customerStore.share.customer.positiveTags.use();

		const currentRecipe = customerStore.share.recipe.data.use();
		const selectedKitchenwares = customerStore.share.recipe.kitchenwares.use();

		const instance_recipe = recipesStore.instance.get();
		const allKitchenwares = recipesStore.kitchenwares.get();
		const allRecipeNames = useMemo(
			() => instance_recipe.getValuesByProp(instance_recipe.data, 'name', true).sort(pinyinSort),
			[instance_recipe]
		);
		const allRecipeTags = recipesStore.positiveTags.get();

		const searchValue = customerStore.share.recipe.searchValue.use();
		const hasNameFilter = useMemo(() => Boolean(searchValue), [searchValue]);

		const tableCurrentPage = customerStore.share.recipe.page.use();
		const tableRowsPerPage = customerStore.page.recipe.table.rows.use();
		const tableSortDescriptor = customerStore.share.recipe.sortDescriptor.use();
		const tableVisibleColumns = customerStore.recipeTableColumns.use();

		const filteredData = useMemo(() => {
			let clonedData = structuredClone(instance_recipe.data) as TRecipesWithSuitability;

			if (!currentCustomer) {
				return clonedData.map((item) => ({
					...item,
					suitability: 0,
					matchedPositiveTags: [] as string[],
					matchedNegativeTags: [] as string[],
				}));
			}

			const {target, name: customerName} = currentCustomer;
			const {positiveTags, negativeTags} = customerStore.instances[target as 'customer_rare']
				.get()
				.getPropsByName(customerName);

			clonedData = clonedData.map((item) => {
				const {
					suitability,
					positiveTags: matchedPositiveTags,
					negativeTags: matchedNegativeTags,
				} = instance_recipe.getCustomerSuitability(item.name, positiveTags, negativeTags);

				return {
					...item,
					suitability,
					matchedPositiveTags,
					matchedNegativeTags,
				};
			});

			if (
				!hasNameFilter &&
				(selectedKitchenwares === 'all' || !selectedKitchenwares.size) &&
				(selectedCustomerPositiveTags === 'all' || !selectedCustomerPositiveTags.size)
			) {
				return clonedData;
			}

			return clonedData.filter(({name, kitchenware, positiveTags}) => {
				const isNameMatch = hasNameFilter ? name.toLowerCase().includes(searchValue.toLowerCase()) : true;
				const isKitchenwareMatch =
					selectedKitchenwares !== 'all' && selectedKitchenwares.size
						? selectedKitchenwares.has(kitchenware)
						: true;
				const isPositiveTagsMatch =
					selectedCustomerPositiveTags !== 'all' && selectedCustomerPositiveTags.size
						? [...selectedCustomerPositiveTags].every((tag) =>
								(positiveTags as string[]).includes(tag as string)
							)
						: true;

				return isNameMatch && isKitchenwareMatch && isPositiveTagsMatch;
			});
		}, [
			currentCustomer,
			customerStore.instances,
			hasNameFilter,
			instance_recipe,
			searchValue,
			selectedCustomerPositiveTags,
			selectedKitchenwares,
		]);

		const sortedData = useMemo(() => {
			const {column, direction} = tableSortDescriptor;
			const isAscending = direction === 'ascending';

			switch (column) {
				case 'recipe':
					return filteredData.toSorted(({name: a}, {name: b}) =>
						isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
					);
				case 'price':
					return filteredData.toSorted(({price: a}, {price: b}) =>
						isAscending ? numberSort(a, b) : numberSort(b, a)
					);
				case 'suitability':
					return filteredData.toSorted(({suitability: a}, {suitability: b}) =>
						isAscending ? numberSort(a, b) : numberSort(b, a)
					);
				default:
					return filteredData;
			}
		}, [filteredData, tableSortDescriptor]);

		const tableCurrentPageItems = useMemo(() => {
			const start = (tableCurrentPage - 1) * tableRowsPerPage;
			const end = start + tableRowsPerPage;

			return sortedData.slice(start, end);
		}, [sortedData, tableCurrentPage, tableRowsPerPage]);

		const tableHeaderColumns = useMemo(() => {
			if (tableVisibleColumns === 'all') {
				return tableColumns;
			}

			return tableColumns.filter(({key}) => tableVisibleColumns.has(key));
		}, [tableVisibleColumns]);

		const tableTotalPages = useMemo(
			() => Math.ceil(filteredData.length / tableRowsPerPage),
			[filteredData.length, tableRowsPerPage]
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
					matchedPositiveTags,
					matchedNegativeTags,
				} = data;

				if (!currentCustomer) {
					return null;
				}

				const {positive: positiveTagStyle, negative: negativeTagStyle} =
					customerTagStyleMap[currentCustomer.target];

				const tags = (
					<TagGroup>
						{positiveTags.toSorted(pinyinSort).map((tag) => (
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
								<div className="inline-flex flex-1 items-center text-nowrap">
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
											customerStore.share.recipe.data.set(instance_recipe.getPropsByName(name));
										}}
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[currentCustomer, customerStore.share.recipe.data, instance_recipe]
		);

		const onSelectedKitchenwaresChange = useCallback(
			(value: Selection) => {
				customerStore.share.recipe.kitchenwares.set(value);
				customerStore.share.recipe.page.set(1);
			},
			[customerStore.share.recipe.kitchenwares, customerStore.share.recipe.page]
		);

		const onSelectedPositiveTagsChange = useCallback(
			(value: Selection) => {
				customerStore.share.customer.positiveTags.set(value);
				customerStore.share.recipe.page.set(1);
			},
			[customerStore.share.customer.positiveTags, customerStore.share.recipe.page]
		);

		const onSearchValueChange = useCallback(
			(value: Key | null) => {
				if (value) {
					customerStore.share.recipe.searchValue.set(value as string);
					customerStore.share.recipe.page.set(1);
				} else {
					customerStore.share.recipe.searchValue.set('');
				}
			},
			[customerStore.share.recipe.page, customerStore.share.recipe.searchValue]
		);

		const onSearchValueClear = useCallback(() => {
			customerStore.share.recipe.searchValue.set('');
			customerStore.share.recipe.page.set(1);
		}, [customerStore.share.recipe.page, customerStore.share.recipe.searchValue]);

		const onTableRowsPerPageChange = useCallback(
			(event: ChangeEvent<HTMLSelectElement>) => {
				customerStore.page.recipe.table.rows.set(Number(event.target.value));
				customerStore.share.recipe.page.set(1);
			},
			[customerStore.page.recipe.table.rows, customerStore.share.recipe.page]
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
					<div className="flex justify-between text-small text-default-400">
						<span>总计{filteredData.length}道料理</span>
						<label className="flex">
							<span className="cursor-auto">表格行数：</span>
							<select
								defaultValue={tableRowsPerPage}
								onChange={onTableRowsPerPageChange}
								className="cursor-pointer bg-transparent outline-none"
							>
								{[5, 7, 10, 15, 20].map((num) => (
									<option key={num} value={num.toString()}>
										{num}
									</option>
								))}
							</select>
						</label>
					</div>
				</div>
			),
			[
				allKitchenwares,
				allRecipeNames,
				allRecipeTags,
				customerStore.recipeTableColumns.set,
				filteredData.length,
				onSearchValueChange,
				onSearchValueClear,
				onSelectedKitchenwaresChange,
				onSelectedPositiveTagsChange,
				onTableRowsPerPageChange,
				searchValue,
				selectedCustomerPositiveTags,
				selectedKitchenwares,
				tableRowsPerPage,
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
						onChange={customerStore.share.recipe.page.set}
					/>
				</div>
			),
			[customerStore.share.recipe.page.set, tableCurrentPage, tableTotalPages]
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
				onSortChange={(config) => customerStore.share.recipe.sortDescriptor.set(config as TTableSortDescriptor)}
				aria-label="料理选择表格"
				classNames={{
					wrapper: 'max-h-[calc(100vh-19rem)]',
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
