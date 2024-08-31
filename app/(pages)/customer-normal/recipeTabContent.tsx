import {forwardRef, memo, useCallback, useMemo} from 'react';
import {twJoin} from 'tailwind-merge';

import {useViewInNewWindow} from '@/hooks';

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
} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faMagnifyingGlass, faPlus, faTags} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {type TTableColumnKey, type TTableSortDescriptor} from '@/(pages)/customer-rare/recipeTabContent';
import {recipeTableColumns as tableColumns} from './constants';
import type {TRecipeWithSuitability, TRecipesWithSuitability} from './types';
import {CUSTOMER_NORMAL_TAG_STYLE} from '@/data';
import {customerNormalStore as store} from '@/stores';
import {checkA11yConfirmKey, numberSort, pinyinSort, processPinyin} from '@/utils';

export type {TTableSortDescriptor} from '@/(pages)/customer-rare/recipeTabContent';

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function RecipeTabContent(_props, ref) {
		const openWindow = useViewInNewWindow();

		const currentCustomerName = store.shared.customer.name.use();
		const currentCustomerPopular = store.shared.customer.popular.use();
		const selectedCustomerPositiveTags = store.shared.customer.positiveTags.use();

		const currentRecipeData = store.shared.recipe.data.use();
		const selectedDlcs = store.shared.recipe.dlcs.use();
		const selectedCookers = store.shared.recipe.cookers.use();

		const instance_customer = store.instances.customer.get();
		const instance_recipe = store.instances.recipe.get();

		const allRecipeDlcs = store.recipe.dlcs.get();
		const allRecipeNames = store.recipe.names.get();
		const allRecipeTags = store.recipe.positiveTags.get();
		const allCookers = store.recipe.cookers.get();

		const searchValue = store.shared.recipe.searchValue.use();
		const hasNameFilter = Boolean(searchValue);

		const tableCurrentPage = store.shared.recipe.page.use();
		const tableRowsPerPage = store.recipeTableRows.use();
		const tableRowsPerPageNumber = store.persistence.recipe.table.rows.use();
		const tableSelectableRows = store.shared.recipe.selectableRows.get();
		const tableSortDescriptor = store.shared.recipe.sortDescriptor.use();
		const tableVisibleColumns = store.recipeTableColumns.use();

		const filteredData = useMemo(() => {
			const data = instance_recipe.data as TRecipesWithSuitability;

			if (!currentCustomerName) {
				return data.map((item) => ({
					...item,
					matchedNegativeTags: [] as string[],
					matchedPositiveTags: [] as string[],
					suitability: 0,
				}));
			}

			const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} =
				instance_customer.getPropsByName(currentCustomerName);

			const dataWithRealSuitability = data.map((item) => {
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
					customerNegativeTags,
					customerPositiveTags
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
				selectedDlcs.size === 0 &&
				selectedCookers.size === 0 &&
				selectedCustomerPositiveTags.size === 0
			) {
				return dataWithRealSuitability;
			}

			const searchValueLowerCase = searchValue.toLowerCase();

			return dataWithRealSuitability.filter(({name, pinyin, dlc, cooker, positiveTags}) => {
				const {pinyinFirstLetters, pinyinWithoutTone} = processPinyin(pinyin);
				const recipeTagsWithPopular = instance_recipe.calculateTagsWithPopular(
					positiveTags,
					currentCustomerPopular
				);

				const isNameMatched = hasNameFilter
					? name.toLowerCase().includes(searchValueLowerCase) ||
						pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
						pinyinFirstLetters.includes(searchValueLowerCase)
					: true;
				const isDlcMatched = selectedDlcs.size > 0 ? selectedDlcs.has(dlc.toString()) : true;
				const isCookerMatched = selectedCookers.size > 0 ? selectedCookers.has(cooker) : true;
				const isPositiveTagsMatched =
					selectedCustomerPositiveTags.size > 0
						? [...selectedCustomerPositiveTags].every((tag) =>
								(recipeTagsWithPopular as string[]).includes(tag as string)
							)
						: true;

				return isNameMatched && isDlcMatched && isCookerMatched && isPositiveTagsMatched;
			});
		}, [
			currentCustomerName,
			currentCustomerPopular,
			hasNameFilter,
			instance_customer,
			instance_recipe,
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
					return [...filteredData].sort(({name: a}, {name: b}) =>
						isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
					);
				case 'price':
					return [...filteredData].sort(({price: a}, {price: b}) =>
						isAscending ? numberSort(a, b) : numberSort(b, a)
					);
				case 'suitability':
					return [...filteredData].sort(({suitability: a}, {suitability: b}) =>
						isAscending ? numberSort(a, b) : numberSort(b, a)
					);
				case 'time':
					return [...filteredData].sort(({min: a}, {min: b}) =>
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

		const tableTotalPages = useMemo(
			() => Math.ceil(filteredData.length / tableRowsPerPageNumber),
			[filteredData.length, tableRowsPerPageNumber]
		);

		const tableSelectedKeys = new Set([currentRecipeData?.name ?? '']);

		const renderTableCell = useCallback(
			(data: TRecipeWithSuitability, columnKey: TTableColumnKey) => {
				const {
					name,
					cooker,
					ingredients,
					positiveTags,
					price,
					suitability,
					max,
					min,
					matchedNegativeTags,
					matchedPositiveTags,
				} = data;

				if (!currentCustomerName) {
					return null;
				}

				const composedRecipeTags = instance_recipe.composeTags(ingredients, [], positiveTags, []);
				const recipeTagsWithPopular = instance_recipe.calculateTagsWithPopular(
					composedRecipeTags,
					currentCustomerPopular
				);
				const {positive: positiveTagStyle, negative: negativeTagStyle} = CUSTOMER_NORMAL_TAG_STYLE;

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
								className={twJoin(
									![...matchedPositiveTags, ...matchedNegativeTags].includes(tag) && 'opacity-50'
								)}
							/>
						))}
					</TagGroup>
				);

				switch (columnKey) {
					case 'recipe': {
						const recipeLabel = '点击：在新窗口中查看此料理的详情';
						return (
							<div className="flex items-center">
								<Tooltip showArrow content={recipeLabel} placement="right" size="sm">
									<Sprite
										target="recipe"
										name={name}
										size={2}
										onClick={() => {
											openWindow('recipes', name);
										}}
										onKeyDown={(event) => {
											if (checkA11yConfirmKey(event)) {
												openWindow('recipes', name);
											}
										}}
										aria-label={recipeLabel}
										role="button"
										tabIndex={0}
										className="mr-2 cursor-pointer"
									/>
								</Tooltip>
								<div className="inline-flex flex-1 items-center whitespace-nowrap">
									<span className="text-small font-medium">{name}</span>
									<span className="-ml-2">
										<Popover showArrow offset={10} size="sm">
											<Tooltip showArrow content={tags} offset={-2} placement="right" size="sm">
												<span>
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
					}
					case 'cooker':
						return (
							<div className="flex">
								<Sprite target="cooker" name={cooker} size={2} />
							</div>
						);
					case 'ingredient': {
						const ingredientLabel = '点击：在新窗口中查看此食材的详情';
						return (
							<div className="flex flex-nowrap">
								{ingredients.map((ingredient, index) => (
									<Tooltip key={index} showArrow content={ingredientLabel} size="sm">
										<Sprite
											target="ingredient"
											name={ingredient}
											size={2}
											onClick={() => {
												openWindow('ingredients', ingredient);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													openWindow('ingredients', ingredient);
												}
											}}
											aria-label={ingredientLabel}
											role="button"
											tabIndex={0}
											className="cursor-pointer"
										/>
									</Tooltip>
								))}
							</div>
						);
					}
					case 'price':
						return (
							<div className="flex">
								<Price>{price}</Price>
							</div>
						);
					case 'suitability':
						return <div className="flex">{suitability}</div>;
					case 'time':
						return (
							<div className="flex">
								{min}
								<span className="px-0.5">-</span>
								{max}秒
							</div>
						);
					case 'action':
						return (
							<div className="flex justify-center">
								<Tooltip showArrow content="选择此项" placement="left" size="sm">
									<Button
										isIconOnly
										size="sm"
										variant="light"
										onPress={() => {
											store.onRecipeTableAction(name);
										}}
										aria-label="选择此项"
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[currentCustomerName, currentCustomerPopular, instance_recipe, openWindow]
		);

		const tableToolbar = useMemo(
			() => (
				<div className="flex flex-col gap-2">
					<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
						<div className="flex flex-1 items-end gap-3">
							<Autocomplete
								allowsCustomValue
								defaultInputValue={searchValue}
								defaultItems={allRecipeNames}
								placeholder="名称"
								size="sm"
								startContent={
									<FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none" />
								}
								variant="flat"
								onClear={store.clearRecipeTableSearchValue}
								onInputChange={store.onRecipeTableSearchValueChange}
								aria-label="选择或输入料理名称"
								title="选择或输入料理名称"
							>
								{({value}) => <AutocompleteItem key={value}>{value}</AutocompleteItem>}
							</Autocomplete>
							<Select
								items={allRecipeTags}
								defaultSelectedKeys={selectedCustomerPositiveTags}
								selectedKeys={selectedCustomerPositiveTags}
								placeholder="标签"
								size="sm"
								startContent={<FontAwesomeIcon icon={faTags} />}
								variant="flat"
								onSelectionChange={store.onRecipeTableSelectedPositiveTagsChange}
								aria-label="选择顾客所点单的料理标签"
								title="选择顾客所点单的料理标签"
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
									onSelectionChange={store.onRecipeTableSelectedCookersChange}
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
									onSelectionChange={store.onRecipeTableSelectedDlcsChange}
									aria-label="选择特定DLC中的料理"
								>
									{({value}) => (
										<DropdownItem key={value} textValue={value.toString()}>
											{value === 0 ? '游戏本体' : value}
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
							<span className="mr-2 cursor-auto whitespace-nowrap">表格行数</span>
							<Select
								items={tableSelectableRows}
								defaultSelectedKeys={tableRowsPerPage}
								selectedKeys={tableRowsPerPage}
								size="sm"
								variant="flat"
								onSelectionChange={store.onRecipeTableRowsPerPageChange}
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
				filteredData.length,
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
						onChange={store.onRecipeTablePageChange}
					/>
				</div>
			),
			[tableCurrentPage, tableTotalPages]
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
					store.onRecipeTableSortChange(config as TTableSortDescriptor);
				}}
				aria-label="料理选择表格"
				classNames={{
					wrapper: 'max-h-[calc(var(--safe-h-dvh)-17.5rem)]',
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
