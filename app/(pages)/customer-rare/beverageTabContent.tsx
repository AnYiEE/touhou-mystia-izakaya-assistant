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

import {customerTagStyleMap, beverageTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TBeverageWithSuitability, TBeveragesWithSuitability} from './types';
import {useBeveragesStore, useCustomerRareStore} from '@/stores';
import {numberSort, pinyinSort} from '@/utils';

type TTableColumnKey = 'beverage' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function BeverageTabContent(_props, ref) {
		const customerStore = useCustomerRareStore();
		const beveragesStore = useBeveragesStore();

		const currentCustomer = customerStore.share.customer.data.use();
		const selectedCustomerBeverageTags = customerStore.share.customer.beverageTags.use();

		const currentBeverage = customerStore.share.beverage.data.use();
		const selectedDlcs = customerStore.share.beverage.dlcs.use();

		const instance_beverage = beveragesStore.instance.get();
		const allBeverageNames = useMemo(
			() => instance_beverage.getValuesByProp(instance_beverage.data, 'name', true).sort(pinyinSort),
			[instance_beverage]
		);
		const allBeverageTags = beveragesStore.tags.get();
		const allDlcs = beveragesStore.dlcs.get();

		const searchValue = customerStore.share.beverage.searchValue.use();
		const hasNameFilter = useMemo(() => Boolean(searchValue), [searchValue]);

		const tableCurrentPage = customerStore.share.beverage.page.use();
		const tableRowsPerPage = customerStore.page.beverage.table.rows.use();
		const tableSortDescriptor = customerStore.share.beverage.sortDescriptor.use();
		const tableVisibleColumns = customerStore.beverageTableColumns.use();

		const filteredData = useMemo(() => {
			let clonedData = structuredClone(instance_beverage.data) as TBeveragesWithSuitability;

			if (!currentCustomer) {
				return clonedData.map((item) => ({
					...item,
					suitability: 0,
					matchedTags: [] as string[],
				}));
			}

			const {target, name: customerName} = currentCustomer;
			const {beverageTags} = customerStore.instances[target as 'customer_rare']
				.get()
				.getPropsByName(customerName);

			clonedData = clonedData.map((item) => {
				const {suitability, tags: matchedTags} = instance_beverage.getCustomerSuitability(
					item.name,
					beverageTags
				);

				return {
					...item,
					suitability,
					matchedTags,
				};
			});

			if (
				!hasNameFilter &&
				(selectedDlcs === 'all' || !selectedDlcs.size) &&
				(selectedCustomerBeverageTags === 'all' || !selectedCustomerBeverageTags.size)
			) {
				return clonedData;
			}

			return clonedData.filter(({name, dlc, tags}) => {
				const isNameMatch = hasNameFilter ? name.toLowerCase().includes(searchValue.toLowerCase()) : true;
				const isDlcMatch =
					selectedDlcs !== 'all' && selectedDlcs.size ? selectedDlcs.has(dlc.toString()) : true;
				const isTagsMatch =
					selectedCustomerBeverageTags !== 'all' && selectedCustomerBeverageTags.size
						? [...selectedCustomerBeverageTags].every((tag) => (tags as string[]).includes(tag as string))
						: true;

				return isNameMatch && isDlcMatch && isTagsMatch;
			});
		}, [
			currentCustomer,
			customerStore.instances,
			hasNameFilter,
			instance_beverage,
			searchValue,
			selectedCustomerBeverageTags,
			selectedDlcs,
		]);

		const sortedData = useMemo(() => {
			const {column, direction} = tableSortDescriptor;
			const isAscending = direction === 'ascending';

			switch (column) {
				case 'beverage':
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

		const tabelSelectedKeys = useMemo(() => new Set([currentBeverage?.name ?? '']), [currentBeverage?.name]);

		const renderTableCell = useCallback(
			(data: TBeverageWithSuitability, columnKey: TTableColumnKey) => {
				const {name, tags: beverageTags, price, suitability, matchedTags} = data;

				if (!currentCustomer) {
					return null;
				}

				const {beverage: beverageTagStyle} = customerTagStyleMap[currentCustomer.target];

				const tags = (
					<TagGroup>
						{beverageTags.toSorted(pinyinSort).map((tag) => (
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
											customerStore.share.beverage.data.set(
												instance_beverage.getPropsByName(name)
											);
										}}
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[currentCustomer, customerStore.share.beverage.data, instance_beverage]
		);

		const onSelectedBeverageTagsChange = useCallback(
			(value: Selection) => {
				customerStore.share.customer.beverageTags.set(value);
				customerStore.share.beverage.page.set(1);
			},
			[customerStore.share.beverage.page, customerStore.share.customer.beverageTags]
		);

		const onSelectedDlcsChange = useCallback(
			(value: Selection) => {
				customerStore.share.beverage.dlcs.set(value);
				customerStore.share.beverage.page.set(1);
			},
			[customerStore.share.beverage.dlcs, customerStore.share.beverage.page]
		);

		const onSearchValueChange = useCallback(
			(value: Key | null) => {
				if (value) {
					customerStore.share.beverage.searchValue.set(value as string);
					customerStore.share.beverage.page.set(1);
				} else {
					customerStore.share.beverage.searchValue.set('');
				}
			},
			[customerStore.share.beverage.page, customerStore.share.beverage.searchValue]
		);

		const onSearchValueClear = useCallback(() => {
			customerStore.share.beverage.searchValue.set('');
			customerStore.share.beverage.page.set(1);
		}, [customerStore.share.beverage.page, customerStore.share.beverage.searchValue]);

		const onTableRowsPerPageChange = useCallback(
			(event: ChangeEvent<HTMLSelectElement>) => {
				customerStore.page.beverage.table.rows.set(Number(event.target.value));
				customerStore.share.beverage.page.set(1);
			},
			[customerStore.page.beverage.table.rows, customerStore.share.beverage.page]
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
									items={allDlcs}
									defaultSelectedKeys={selectedDlcs}
									selectedKeys={selectedDlcs}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={onSelectedDlcsChange}
									aria-label="选择特定DLC中的酒水"
								>
									{({value}) => <DropdownItem key={value}>{value}</DropdownItem>}
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
									onSelectionChange={customerStore.beverageTableColumns.set}
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
						<span>总计{filteredData.length}种酒水</span>
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
				allBeverageNames,
				allBeverageTags,
				allDlcs,
				customerStore.beverageTableColumns.set,
				filteredData.length,
				onSearchValueChange,
				onSearchValueClear,
				onSelectedBeverageTagsChange,
				onSelectedDlcsChange,
				onTableRowsPerPageChange,
				searchValue,
				selectedCustomerBeverageTags,
				selectedDlcs,
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
						onChange={customerStore.share.beverage.page.set}
					/>
				</div>
			),
			[customerStore.share.beverage.page.set, tableCurrentPage, tableTotalPages]
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
				onSortChange={(config) =>
					customerStore.share.beverage.sortDescriptor.set(config as TTableSortDescriptor)
				}
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
