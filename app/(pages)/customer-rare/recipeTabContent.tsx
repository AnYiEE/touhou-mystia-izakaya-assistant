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
	SortDescriptor,
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

import {customerTagStyleMap} from './constants';
import type {ICurrentCustomer, TRecipe} from './types';
import {getCustomerInstance} from './utils';
import {foodInstances} from '@/methods/food/index';
import {pinyinSort, numberSort} from '@/utils';

type TRecipeWithSuitability = TRecipe & {
	suitability: number;
	matchedPositiveTags: string[];
	matchedNegativeTags: string[];
};
type TRecipesWithSuitability = TRecipeWithSuitability[];

const {recipe: instance} = foodInstances;
const {data: originalData} = instance;

const allKitchenwares = instance.getValuesByProp(originalData, 'kitchenware', true).sort(pinyinSort);
const allRecipeNames = instance.getValuesByProp(originalData, 'name', true).sort(pinyinSort);
const allRecipeTags = instance.getValuesByProp(originalData, 'positive', true).sort(pinyinSort);

type TTableColumnKey = 'recipe' | 'kitchenware' | 'ingredient' | 'price' | 'suitability' | 'action';
interface ITableColumn {
	key: TTableColumnKey;
	label: string;
	sortable: boolean;
}
type TTableColumns = ITableColumn[];

type TTableSortKey = Exclude<TTableColumnKey, 'kitchenware' | 'ingredient' | 'action'>;
interface ITableSortDescriptor extends SortDescriptor {
	column?: TTableSortKey;
	direction?: NonNullable<SortDescriptor['direction']>;
}

const tableColumns = [
	{key: 'recipe', label: '料理', sortable: true},
	{key: 'kitchenware', label: '厨具', sortable: false},
	{key: 'ingredient', label: '食材', sortable: false},
	{key: 'price', label: '售价', sortable: true},
	{key: 'suitability', label: '匹配度', sortable: true},
	{key: 'action', label: '操作', sortable: false},
] as const satisfies TTableColumns;

interface IProps {
	currentCustomer: ICurrentCustomer | null;
	currentRecipe: TRecipe | null;
	setCurrentRecipe: Dispatch<SetStateAction<IProps['currentRecipe']>>;
	selectedCustomerPositiveTags: Selection;
	setSelectedCustomerPositiveTags: Dispatch<SetStateAction<IProps['selectedCustomerPositiveTags']>>;
}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function RecipeTabContent(
		{
			currentCustomer,
			currentRecipe,
			setCurrentRecipe,
			selectedCustomerPositiveTags,
			setSelectedCustomerPositiveTags,
		},
		ref
	) {
		const [selectedKitchenwares, setSelectedKitchenwares] = useState<Selection>(new Set());
		const [searchValue, setSearchValue] = useState('');
		const hasRecipeNameFilter = useMemo(() => Boolean(searchValue), [searchValue]);

		const [tableCurrentPage, setTableCurrentPage] = useState(1);
		const [tableRowsPerPage, setTableRowsPerPage] = useState(7);
		const [tableSortDescriptor, setSortDescriptor] = useState<ITableSortDescriptor>({});
		const [tableVisibleColumns, setTableVisibleColumns] = useState<Selection>(
			new Set(tableColumns.filter(({key}) => key !== 'kitchenware').map(({key}) => key))
		);

		const filteredData = useMemo(() => {
			let clonedData = structuredClone(originalData) as TRecipesWithSuitability;

			if (!currentCustomer) {
				return clonedData.map((item) => ({
					...item,
					suitability: 0,
					matchedPositiveTags: [] as string[],
					matchedNegativeTags: [] as string[],
				}));
			}

			const {target, name: customerName} = currentCustomer;
			const customerInstance = getCustomerInstance(target);
			const {positive, negative} = customerInstance.getPropsByName(customerName);

			clonedData = clonedData.map((item) => {
				const {
					suitability,
					positive: matchedPositiveTags,
					negative: matchedNegativeTags,
				} = instance.getCustomerSuitability(item.name, positive, negative);

				return {
					...item,
					suitability,
					matchedPositiveTags,
					matchedNegativeTags,
				};
			});

			if (
				!hasRecipeNameFilter &&
				(selectedKitchenwares === 'all' || !selectedKitchenwares.size) &&
				(selectedCustomerPositiveTags === 'all' || !selectedCustomerPositiveTags.size)
			) {
				return clonedData;
			}

			return clonedData.filter(({name, kitchenware, positive: tags}) => {
				const isNameMatch = hasRecipeNameFilter ? name.includes(searchValue) : true;
				const isKitchenwareMatch =
					selectedKitchenwares !== 'all' && selectedKitchenwares.size
						? selectedKitchenwares.has(kitchenware)
						: true;
				const isPositiveTagsMatch =
					selectedCustomerPositiveTags !== 'all' && selectedCustomerPositiveTags.size
						? [...selectedCustomerPositiveTags].every((tag) => (tags as string[]).includes(tag as string))
						: true;

				return isNameMatch && isKitchenwareMatch && isPositiveTagsMatch;
			});
		}, [currentCustomer, hasRecipeNameFilter, searchValue, selectedKitchenwares, selectedCustomerPositiveTags]);

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
					positive,
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
						{positive.toSorted(pinyinSort).map((tag) => (
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
											setCurrentRecipe(instance.getPropsByName(name));
										}}
									>
										<FontAwesomeIcon icon={faPlus} />
									</Button>
								</Tooltip>
							</div>
						);
				}
			},
			[currentCustomer, setCurrentRecipe]
		);

		const onSelectedKitchenwaresChange = useCallback((value: Selection) => {
			setSelectedKitchenwares(value);
			setTableCurrentPage(1);
		}, []);

		const onSelectedPositiveTagsChange = useCallback(
			(value: Selection) => {
				setSelectedCustomerPositiveTags(value);
				setTableCurrentPage(1);
			},
			[setSelectedCustomerPositiveTags]
		);

		const onRecipeSearchValueChange = useCallback((value: Key | null) => {
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
								defaultItems={allRecipeNames}
								placeholder="名称"
								size="sm"
								startContent={<FontAwesomeIcon icon={faMagnifyingGlass} />}
								variant="flat"
								onClear={onSearchValueClear}
								onInputChange={onRecipeSearchValueChange}
								onSelectionChange={onRecipeSearchValueChange}
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
				filteredData.length,
				onRecipeSearchValueChange,
				onSearchValueClear,
				onSelectedKitchenwaresChange,
				onSelectedPositiveTagsChange,
				onTableRowsPerPageChange,
				searchValue,
				selectedKitchenwares,
				selectedCustomerPositiveTags,
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
				onSortChange={(config) => setSortDescriptor(config as ITableSortDescriptor)}
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
