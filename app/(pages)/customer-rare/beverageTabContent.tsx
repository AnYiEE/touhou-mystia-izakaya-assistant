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

import {customerTagStyleMap, beverageTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TBeverageWithSuitability, TBeveragesWithSuitability} from './types';
import {useCustomerRareStore} from '@/stores';
import {numberSort, pinyinSort} from '@/utils';

type TTableColumnKey = 'beverage' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function BeverageTabContent(_props, ref) {
		const store = useCustomerRareStore();

		const currentCustomer = store.share.customer.data.use();
		const selectedCustomerBeverageTags = store.share.customer.beverageTags.use();

		const currentBeverageName = store.share.beverage.name.use();
		const selectedDlcs = store.share.beverage.dlcs.use();

		const instance_beverage = store.instances.beverage.get();

		const allBeverageNames = store.beverage.names.get();
		const allBeverageDlcs = store.beverage.dlcs.get();
		const allBeverageTags = store.beverage.tags.get();

		const searchValue = store.share.beverage.searchValue.use();
		const hasNameFilter = useMemo(() => Boolean(searchValue), [searchValue]);

		const tableCurrentPage = store.share.beverage.page.use();
		const tableRowsPerPage = store.recipeTableRows.use();
		const tableRowsPerPageNumber = store.page.beverage.table.rows.use();
		const tableSelectableRows = store.share.beverage.selectableRows.get();
		const tableSortDescriptor = store.share.beverage.sortDescriptor.use();
		const tableVisibleColumns = store.beverageTableColumns.use();

		const filteredData = useMemo(() => {
			let clonedData = cloneDeep(instance_beverage.data) as TBeveragesWithSuitability;

			if (!currentCustomer) {
				return clonedData.map((item) => ({
					...item,
					matchedTags: [] as string[],
					suitability: 0,
				}));
			}

			const {target, name: customerName} = currentCustomer;
			const {beverageTags} = store.instances[target as 'customer_rare'].get().getPropsByName(customerName);

			clonedData = clonedData.map((item) => {
				const {suitability, tags: matchedTags} = instance_beverage.getCustomerSuitability(
					item.name,
					beverageTags
				);

				return {
					...item,
					matchedTags,
					suitability,
				};
			});

			if (
				!hasNameFilter &&
				(selectedDlcs === 'all' || selectedDlcs.size === 0) &&
				(selectedCustomerBeverageTags === 'all' || selectedCustomerBeverageTags.size === 0)
			) {
				return clonedData;
			}

			return clonedData.filter(({name, dlc, tags}) => {
				const isNameMatch = hasNameFilter ? name.toLowerCase().includes(searchValue.toLowerCase()) : true;
				const isDlcMatch =
					selectedDlcs !== 'all' && selectedDlcs.size > 0 ? selectedDlcs.has(dlc.toString()) : true;
				const isTagsMatch =
					selectedCustomerBeverageTags !== 'all' && selectedCustomerBeverageTags.size > 0
						? [...selectedCustomerBeverageTags].every((tag) => (tags as string[]).includes(tag as string))
						: true;

				return isNameMatch && isDlcMatch && isTagsMatch;
			});
		}, [
			currentCustomer,
			hasNameFilter,
			instance_beverage,
			searchValue,
			selectedCustomerBeverageTags,
			selectedDlcs,
			store.instances,
		]);

		const sortedData = useMemo(() => {
			const {column, direction} = tableSortDescriptor;
			const isAscending = direction === 'ascending';

			switch (column) {
				case 'beverage':
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

		const tabelSelectedKeys = useMemo(() => new Set([currentBeverageName ?? '']), [currentBeverageName]);

		const renderTableCell = useCallback(
			(data: TBeverageWithSuitability, columnKey: TTableColumnKey) => {
				const {name, price, suitability, matchedTags, tags: beverageTags} = data;

				if (!currentCustomer) {
					return null;
				}

				const {beverage: beverageTagStyle} = customerTagStyleMap[currentCustomer.target];

				const tags = (
					<TagGroup>
						{[...beverageTags].sort(pinyinSort).map((tag) => (
							<Tags.Tag
								key={tag}
								tag={tag}
								tagStyle={matchedTags.includes(tag) ? beverageTagStyle : {}}
								className={clsx(!matchedTags.includes(tag) && 'opacity-50')}
							/>
						))}
					</TagGroup>
				);

				switch (columnKey) {
					case 'beverage':
						return (
							<div className="flex items-center">
								<Sprite target="beverage" name={name} size={2} className="mr-2" />
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
															aria-label="酒水标签"
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
											store.share.beverage.name.set(name);
										}}
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[currentCustomer, store.share.beverage.name]
		);

		const onSelectedBeverageTagsChange = useCallback(
			(value: Selection) => {
				store.share.customer.beverageTags.set(value);
				store.share.beverage.page.set(1);
			},
			[store.share.beverage.page, store.share.customer.beverageTags]
		);

		const onSelectedDlcsChange = useCallback(
			(value: Selection) => {
				store.share.beverage.dlcs.set(value);
				store.share.beverage.page.set(1);
			},
			[store.share.beverage.dlcs, store.share.beverage.page]
		);

		const onSearchValueChange = useCallback(
			(value: Key | null) => {
				if (value) {
					store.share.beverage.searchValue.set(value as string);
					store.share.beverage.page.set(1);
				} else {
					store.share.beverage.searchValue.set('');
				}
			},
			[store.share.beverage.page, store.share.beverage.searchValue]
		);

		const onSearchValueClear = useCallback(() => {
			store.share.beverage.searchValue.set('');
			store.share.beverage.page.set(1);
		}, [store.share.beverage.page, store.share.beverage.searchValue]);

		const onTableRowsPerPageChange = useCallback(
			(value: Selection) => {
				store.beverageTableRows.set(value);
				store.share.beverage.page.set(1);
			},
			[store.beverageTableRows, store.share.beverage.page]
		);

		const tableToolbar = useMemo(
			() => (
				<div className="flex flex-col gap-2">
					<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
						<div className="flex flex-1 gap-3">
							<Autocomplete
								allowsCustomValue
								defaultInputValue={searchValue}
								defaultItems={allBeverageNames}
								placeholder="名称"
								size="sm"
								startContent={<FontAwesomeIcon icon={faMagnifyingGlass} />}
								variant="flat"
								onClear={onSearchValueClear}
								onInputChange={onSearchValueChange}
								onSelectionChange={onSearchValueChange}
								aria-label="选择或输入酒水名称"
								title="选择或输入酒水名称"
							>
								{({value}) => <AutocompleteItem key={value}>{value}</AutocompleteItem>}
							</Autocomplete>
							<Select
								items={allBeverageTags}
								defaultSelectedKeys={selectedCustomerBeverageTags}
								selectedKeys={selectedCustomerBeverageTags}
								selectionMode="multiple"
								placeholder="标签"
								size="sm"
								startContent={<FontAwesomeIcon icon={faTags} />}
								variant="flat"
								onSelectionChange={onSelectedBeverageTagsChange}
								aria-label="选择目标酒水所包含的标签"
								title="选择目标酒水所包含的标签"
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
										DLC
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									closeOnSelect={false}
									items={allBeverageDlcs}
									defaultSelectedKeys={selectedDlcs}
									selectedKeys={selectedDlcs}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={onSelectedDlcsChange}
									aria-label="选择特定DLC中的酒水"
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
									disabledKeys={['action', 'beverage'] satisfies TTableColumnKey[]}
									selectedKeys={tableVisibleColumns}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={store.beverageTableColumns.set}
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
						<span>总计{filteredData.length}种酒水</span>
						<label className="flex items-center">
							<span className="mr-2 cursor-auto text-nowrap">表格行数</span>
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
				allBeverageDlcs,
				allBeverageNames,
				allBeverageTags,
				filteredData.length,
				onSearchValueChange,
				onSearchValueClear,
				onSelectedBeverageTagsChange,
				onSelectedDlcsChange,
				onTableRowsPerPageChange,
				searchValue,
				selectedCustomerBeverageTags,
				selectedDlcs,
				store.beverageTableColumns.set,
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
						onChange={store.share.beverage.page.set}
					/>
				</div>
			),
			[store.share.beverage.page.set, tableCurrentPage, tableTotalPages]
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
					store.share.beverage.sortDescriptor.set(config as TTableSortDescriptor);
				}}
				aria-label="酒水选择表格"
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
