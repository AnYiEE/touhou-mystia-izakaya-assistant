import {
	forwardRef,
	memo,
	useCallback,
	useMemo,
	useState,
	type ChangeEvent,
	type Dispatch,
	type Key,
	type SetStateAction,
} from 'react';
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

import {customerTagStyleMap, instance_beverage} from './constants';
import type {
	ICurrentCustomer,
	ITableColumn,
	ITableSortDescriptor,
	TBeverage,
	TBeverageWithSuitability,
	TBeveragesWithSuitability,
} from './types';
import {getCustomerInstance} from './utils';
import {pinyinSort, numberSort} from '@/utils';

const {data: originalData} = instance_beverage;

const allBeverageNames = instance_beverage.getValuesByProp(originalData, 'name', true).sort(pinyinSort);
const allBeverageTags = instance_beverage.sortedTag.map((value) => ({value}));

type TTableColumnKey = 'beverage' | 'price' | 'suitability' | 'action';
type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'action'>;
type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

const tableColumns = [
	{key: 'beverage', label: '酒水', sortable: true},
	{key: 'price', label: '售价', sortable: true},
	{key: 'suitability', label: '匹配度', sortable: true},
	{key: 'action', label: '操作', sortable: false},
] as const satisfies TTableColumns;

interface IProps {
	currentCustomer: ICurrentCustomer | null;
	currentBeverage: TBeverage | null;
	setCurrentBeverage: Dispatch<SetStateAction<IProps['currentBeverage']>>;
	selectedCustomerBeverageTags: Selection;
	setSelectedCustomerBeverageTags: Dispatch<SetStateAction<IProps['selectedCustomerBeverageTags']>>;
}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function BeverageTabContent(
		{
			currentCustomer,
			currentBeverage,
			setCurrentBeverage,
			selectedCustomerBeverageTags,
			setSelectedCustomerBeverageTags,
		},
		ref
	) {
		const [searchValue, setSearchValue] = useState('');
		const hasNameFilter = useMemo(() => Boolean(searchValue), [searchValue]);

		const [tableCurrentPage, setTableCurrentPage] = useState(1);
		const [tableRowsPerPage, setTableRowsPerPage] = useState(7);
		const [tableSortDescriptor, setSortDescriptor] = useState<TTableSortDescriptor>({});
		const [tableVisibleColumns, setTableVisibleColumns] = useState<Selection>(
			new Set(tableColumns.map(({key}) => key))
		);

		const filteredData = useMemo(() => {
			let clonedData = structuredClone(originalData) as TBeveragesWithSuitability;

			if (!currentCustomer) {
				return clonedData.map((item) => ({
					...item,
					suitability: 0,
					matchedTags: [] as string[],
				}));
			}

			const {target, name: customerName} = currentCustomer;
			const customerInstance = getCustomerInstance(target);
			const {beverage} = customerInstance.getPropsByName(customerName);

			clonedData = clonedData.map((item) => {
				const {suitability, tag: matchedTags} = instance_beverage.getCustomerSuitability(item.name, beverage);

				return {
					...item,
					suitability,
					matchedTags,
				};
			});

			if (!hasNameFilter && (selectedCustomerBeverageTags === 'all' || !selectedCustomerBeverageTags.size)) {
				return clonedData;
			}

			return clonedData.filter(({name, tag: tags}) => {
				const isNameMatch = hasNameFilter ? name.includes(searchValue) : true;
				const isTagsMatch =
					selectedCustomerBeverageTags !== 'all' && selectedCustomerBeverageTags.size
						? [...selectedCustomerBeverageTags].every((tag) => (tags as string[]).includes(tag as string))
						: true;

				return isNameMatch && isTagsMatch;
			});
		}, [currentCustomer, hasNameFilter, selectedCustomerBeverageTags, searchValue]);

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
				const {name, tag: beverageTags, price, suitability, matchedTags} = data;

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
											setCurrentBeverage(instance_beverage.getPropsByName(name));
										}}
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[currentCustomer, setCurrentBeverage]
		);

		const onSelectedBeverageTagsChange = useCallback(
			(value: Selection) => {
				setSelectedCustomerBeverageTags(value);
				setTableCurrentPage(1);
			},
			[setSelectedCustomerBeverageTags]
		);

		const onSearchValueChange = useCallback((value: Key | null) => {
			if (value) {
				setSearchValue(value as string);
				setTableCurrentPage(1);
			} else {
				setSearchValue('');
			}
		}, []);

		const onSearchValueClear = useCallback(() => {
			setSearchValue('');
			setTableCurrentPage(1);
		}, []);

		const onTableRowsPerPageChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
			setTableRowsPerPage(Number(event.target.value));
			setTableCurrentPage(1);
		}, []);

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
									onSelectionChange={setTableVisibleColumns}
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
				filteredData.length,
				onSearchValueChange,
				onSearchValueClear,
				onSelectedBeverageTagsChange,
				onTableRowsPerPageChange,
				searchValue,
				selectedCustomerBeverageTags,
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
						onChange={setTableCurrentPage}
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
				selectedKeys={tabelSelectedKeys}
				selectionMode="single"
				sortDescriptor={tableSortDescriptor}
				topContent={tableToolbar}
				topContentPlacement="outside"
				onSortChange={(config) => setSortDescriptor(config as TTableSortDescriptor)}
				aria-label="酒水选择表格"
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
