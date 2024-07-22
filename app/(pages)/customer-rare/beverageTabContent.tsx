import {type Key, forwardRef, memo, useCallback, useMemo} from 'react';
import {twJoin} from 'tailwind-merge';
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
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {customerTagStyleMap, beverageTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TBeverageWithSuitability, TBeveragesWithSuitability} from './types';
import {useCustomerRareStore, useGlobalStore} from '@/stores';
import {numberSort, pinyinSort, processPinyin} from '@/utils';

type TTableColumnKey = 'beverage' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function BeverageTabContent(_props, ref) {
		const customerStore = useCustomerRareStore();
		const globalStore = useGlobalStore();

		const currentCustomer = customerStore.shared.customer.data.use();
		const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();

		const currentBeverageName = customerStore.shared.beverage.name.use();
		const selectedDlcs = customerStore.shared.beverage.dlcs.use();

		const currentGlobalPopular = globalStore.persistence.popular.use();

		const instance_rare = customerStore.instances.customer_rare.get();
		const instance_special = customerStore.instances.customer_special.get();
		const instance_beverage = customerStore.instances.beverage.get();

		const allBeverageNames = customerStore.beverage.names.get();
		const allBeverageDlcs = customerStore.beverage.dlcs.get();
		const allBeverageTags = customerStore.beverage.tags.get();

		const searchValue = customerStore.shared.beverage.searchValue.use();
		const hasNameFilter = Boolean(searchValue);

		const tableCurrentPage = customerStore.shared.beverage.page.use();
		const tableRowsPerPage = customerStore.recipeTableRows.use();
		const tableRowsPerPageNumber = customerStore.persistence.beverage.table.rows.use();
		const tableSelectableRows = customerStore.shared.beverage.selectableRows.get();
		const tableSortDescriptor = customerStore.shared.beverage.sortDescriptor.use();
		const tableVisibleColumns = customerStore.beverageTableColumns.use();

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

			const instance_customer = (
				target === 'customer_rare' ? instance_rare : instance_special
			) as typeof instance_rare;

			const {beverageTags} = instance_customer.getPropsByName(customerName);

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

			const searchValueLowerCase = searchValue.toLowerCase();

			return clonedData.filter(({name, pinyin, dlc, tags}) => {
				const {pinyinFirstLetters, pinyinWithoutTone} = processPinyin(pinyin);

				const isNameMatched = hasNameFilter
					? name.toLowerCase().includes(searchValueLowerCase) ||
						pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
						pinyinFirstLetters.includes(searchValueLowerCase)
					: true;
				const isDlcMatched =
					selectedDlcs !== 'all' && selectedDlcs.size > 0 ? selectedDlcs.has(dlc.toString()) : true;
				const isTagsMatched =
					selectedCustomerBeverageTags !== 'all' && selectedCustomerBeverageTags.size > 0
						? [...selectedCustomerBeverageTags].every((tag) => (tags as string[]).includes(tag as string))
						: true;

				return isNameMatched && isDlcMatched && isTagsMatched;
			});
		}, [
			currentCustomer,
			hasNameFilter,
			instance_beverage,
			instance_rare,
			instance_special,
			searchValue,
			selectedCustomerBeverageTags,
			selectedDlcs,
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

		const tableSelectedKeys = new Set([currentBeverageName ?? '']);

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
								className={twJoin(!matchedTags.includes(tag) && 'opacity-50')}
							/>
						))}
					</TagGroup>
				);

				switch (columnKey) {
					case 'beverage':
						return (
							<div className="flex items-center gap-2">
								<Sprite target="beverage" name={name} size={2} />
								<div className="inline-flex flex-1 items-center whitespace-nowrap">
									<span className="text-small font-medium">{name}</span>
									<span className="-ml-2">
										<Popover showArrow>
											<Tooltip showArrow content={tags} offset={-2} placement="right">
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
									</span>
								</div>
							</div>
						);
					case 'price':
						return (
							<div className="flex">
								<Price>{price}</Price>
							</div>
						);
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
											customerStore.shared.beverage.name.set(name);
											trackEvent(TrackCategory.Select, 'Beverage', name);
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
			[
				currentCustomer,
				currentGlobalPopular,
				customerStore.shared.beverage.name,
				customerStore.shared.customer.popular,
			]
		);

		const onSelectedBeverageTagsChange = useCallback(
			(value: Selection) => {
				customerStore.shared.customer.beverageTags.set(value);
				customerStore.shared.beverage.page.set(1);
			},
			[customerStore.shared.beverage.page, customerStore.shared.customer.beverageTags]
		);

		const onSelectedDlcsChange = useCallback(
			(value: Selection) => {
				customerStore.shared.beverage.dlcs.set(value);
				customerStore.shared.beverage.page.set(1);
			},
			[customerStore.shared.beverage.dlcs, customerStore.shared.beverage.page]
		);

		const onSearchValueChange = useCallback(
			(value: Key | null) => {
				if (value) {
					customerStore.shared.beverage.searchValue.set(value as string);
					customerStore.shared.beverage.page.set(1);
				} else {
					customerStore.shared.beverage.searchValue.set('');
				}
			},
			[customerStore.shared.beverage.page, customerStore.shared.beverage.searchValue]
		);

		const onSearchValueClear = useCallback(() => {
			customerStore.shared.beverage.searchValue.set('');
			customerStore.shared.beverage.page.set(1);
		}, [customerStore.shared.beverage.page, customerStore.shared.beverage.searchValue]);

		const onTableRowsPerPageChange = useCallback(
			(value: Selection) => {
				customerStore.beverageTableRows.set(value);
				customerStore.shared.beverage.page.set(1);
			},
			[customerStore.beverageTableRows, customerStore.shared.beverage.page]
		);

		const tableToolbar = useMemo(
			() => (
				<div className="flex flex-col gap-2">
					<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
						<div className="flex flex-1 items-end gap-3">
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
					<div className="flex items-center justify-between text-small text-default-400">
						<span>总计{filteredData.length}种酒水</span>
						<label className="flex items-center gap-2">
							<span className="cursor-auto whitespace-nowrap">表格行数</span>
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
				customerStore.beverageTableColumns.set,
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
						onChange={customerStore.shared.beverage.page.set}
					/>
				</div>
			),
			[customerStore.shared.beverage.page.set, tableCurrentPage, tableTotalPages]
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
					customerStore.shared.beverage.sortDescriptor.set(config as TTableSortDescriptor);
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
