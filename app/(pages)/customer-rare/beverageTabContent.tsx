import {forwardRef, useCallback, useMemo} from 'react';
import {twJoin} from 'tailwind-merge';

import {useVibrate, useViewInNewWindow} from '@/hooks';

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

import {customerTagStyleMap, beverageTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TBeverageWithSuitability, TBeveragesWithSuitability} from './types';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, checkArraySubsetOf, numberSort, pinyinSort, processPinyin} from '@/utils';

export type TTableColumnKey = 'beverage' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

interface IProps {}

export default forwardRef<HTMLTableElement | null, IProps>(function BeverageTabContent(_props, ref) {
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

	const currentCustomerData = customerStore.shared.customer.data.use();
	const selectedCustomerBeverageTags = customerStore.shared.customer.beverageTags.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const selectedDlcs = customerStore.shared.beverage.dlcs.use();

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
		const data = instance_beverage.data as TBeveragesWithSuitability;

		if (!currentCustomerData) {
			return data.map((item) => ({
				...item,
				matchedTags: [] as string[],
				suitability: 0,
			}));
		}

		const {target, name: currentCustomerName} = currentCustomerData;

		const instance_customer = (
			target === 'customer_rare' ? instance_rare : instance_special
		) as typeof instance_rare;

		const {beverageTags} = instance_customer.getPropsByName(currentCustomerName);

		const dataWithRealSuitability = data.map((item) => {
			const {suitability, tags: matchedTags} = instance_beverage.getCustomerSuitability(item.name, beverageTags);

			return {
				...item,
				matchedTags,
				suitability,
			};
		});

		if (!hasNameFilter && selectedDlcs.size === 0 && selectedCustomerBeverageTags.size === 0) {
			return dataWithRealSuitability;
		}

		const searchValueLowerCase = searchValue.toLowerCase();

		return dataWithRealSuitability.filter(({name, pinyin, dlc, tags}) => {
			const {pinyinFirstLetters, pinyinWithoutTone} = processPinyin(pinyin);

			const isNameMatched = hasNameFilter
				? name.toLowerCase().includes(searchValueLowerCase) ||
					pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
					pinyinFirstLetters.includes(searchValueLowerCase)
				: true;
			const isDlcMatched = selectedDlcs.size > 0 ? selectedDlcs.has(dlc.toString()) : true;
			const isTagsMatched =
				selectedCustomerBeverageTags.size > 0
					? checkArraySubsetOf([...selectedCustomerBeverageTags], tags)
					: true;

			return isNameMatched && isDlcMatched && isTagsMatched;
		});
	}, [
		currentCustomerData,
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

	const tableSelectedKeys = new Set([currentBeverageName ?? '']);

	const renderTableCell = useCallback(
		(data: TBeverageWithSuitability, columnKey: TTableColumnKey) => {
			const {name, price, suitability, matchedTags, tags: beverageTags} = data;

			if (!currentCustomerData) {
				return null;
			}

			const {beverage: beverageTagStyle} = customerTagStyleMap[currentCustomerData.target];

			const tags = (
				<TagGroup>
					{[...beverageTags].sort(pinyinSort).map((tag) => {
						const isTagMatched = matchedTags.includes(tag);
						const tagStyle = isTagMatched ? beverageTagStyle : {};
						const tagType = isTagMatched ? 'positive' : null;
						return (
							<Tags.Tag
								key={tag}
								tag={tag}
								tagStyle={tagStyle}
								tagType={tagType}
								className={twJoin(!isTagMatched && 'opacity-50')}
							/>
						);
					})}
				</TagGroup>
			);

			switch (columnKey) {
				case 'beverage': {
					const label = '点击：在新窗口中查看此酒水的详情';
					return (
						<div className="flex items-center gap-2">
							<Tooltip showArrow content={label} placement="right" size="sm">
								<Sprite
									target="beverage"
									name={name}
									size={2}
									onClick={() => {
										openWindow('beverages', name);
									}}
									onKeyDown={(event) => {
										if (checkA11yConfirmKey(event)) {
											openWindow('beverages', name);
										}
									}}
									aria-label={label}
									role="button"
									tabIndex={0}
									className="cursor-pointer"
								/>
							</Tooltip>
							<div className="inline-flex flex-1 items-center whitespace-nowrap">
								<span className="text-sm font-medium">{name}</span>
								<span className="-ml-1.5">
									<Popover showArrow offset={10} size="sm">
										<Tooltip showArrow content={tags} offset={-2} placement="right" size="sm">
											<span className="inline-flex">
												<PopoverTrigger>
													<FontAwesomeIconButton
														icon={faTags}
														variant="light"
														aria-label="酒水标签"
														className="inline h-4 w-4 scale-75 text-default-300 data-[hover=true]:bg-transparent dark:text-default-400"
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
				case 'price':
					return (
						<div className="flex">
							<Price>{price}</Price>
						</div>
					);
				case 'suitability':
					return (
						<div className="flex">
							<Price showSymbol={false}>{suitability}</Price>
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
										customerStore.onBeverageTableAction(name);
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
		[currentCustomerData, openWindow, vibrate]
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
							startContent={<FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none" />}
							variant="flat"
							onClear={customerStore.clearBeverageTableSearchValue}
							onInputChange={customerStore.onBeverageTableSearchValueChange}
							aria-label="选择或输入酒水名称"
							title="选择或输入酒水名称"
							classNames={{
								base: twJoin(
									"[&>*_[data-slot='input-wrapper']]:!bg-default/40 [&>*_[data-slot='input-wrapper']]:hover:opacity-hover",
									isShowBackgroundImage && 'backdrop-blur'
								),
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
										<Sprite target="beverage" name={value} size={1} />
										<span className="ml-1">{value}</span>
									</span>
								</AutocompleteItem>
							)}
						</Autocomplete>
						<Select
							items={allBeverageTags}
							defaultSelectedKeys={selectedCustomerBeverageTags}
							selectedKeys={selectedCustomerBeverageTags}
							placeholder="标签"
							size="sm"
							startContent={<FontAwesomeIcon icon={faTags} />}
							variant="flat"
							onSelectionChange={customerStore.onBeverageTableSelectedTagsChange}
							aria-label="选择顾客所点单的酒水标签"
							title="选择顾客所点单的酒水标签"
							classNames={{
								trigger: twJoin(
									'bg-default/40 data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover',
									isShowBackgroundImage && 'backdrop-blur'
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
									variant="flat"
									className={twJoin(isShowBackgroundImage && 'backdrop-blur')}
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
								onSelectionChange={customerStore.onBeverageTableSelectedDlcsChange}
								aria-label="选择特定DLC中的酒水"
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
									className={twJoin(isShowBackgroundImage && 'backdrop-blur')}
								>
									条目
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								disallowEmptySelection
								closeOnSelect={false}
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
				<div className="flex items-center justify-between text-sm text-default-400">
					<span>总计{filteredData.length}种酒水</span>
					<label className="flex items-center gap-2">
						<span className="cursor-auto whitespace-nowrap">表格行数</span>
						<Select
							disallowEmptySelection
							items={tableSelectableRows}
							defaultSelectedKeys={tableRowsPerPage}
							selectedKeys={tableRowsPerPage}
							size="sm"
							variant="flat"
							onSelectionChange={customerStore.onBeverageTableRowsPerPageChange}
							aria-label="选择表格每页最大行数"
							title="选择表格每页最大行数"
							classNames={{
								base: 'min-w-16',
								popoverContent: 'min-w-20',
								trigger: twJoin(
									'h-6 min-h-6 bg-default/40 data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover',
									isShowBackgroundImage && 'backdrop-blur'
								),
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
			isShowBackgroundImage,
			searchValue,
			selectedCustomerBeverageTags,
			selectedDlcs,
			tableRowsPerPage,
			tableSelectableRows,
			tableVisibleColumns,
		]
	);

	const tablePagination = useMemo(
		() => (
			<div className="flex justify-center">
				{tableCurrentPageItems.length > 0 && (
					<Pagination
						showShadow
						size="sm"
						page={tableCurrentPage}
						total={tableTotalPages}
						onChange={customerStore.onBeverageTablePageChange}
						classNames={{
							item: twJoin('bg-default-100/70', isShowBackgroundImage && 'backdrop-blur'),
						}}
					/>
				)}
			</div>
		),
		[isShowBackgroundImage, tableCurrentPage, tableCurrentPageItems.length, tableTotalPages]
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
				vibrate();
				customerStore.onBeverageTableSortChange(config as TTableSortDescriptor);
			}}
			aria-label="酒水选择表格"
			classNames={{
				th: twJoin(isShowBackgroundImage && 'bg-default-100/40'),
				wrapper: twJoin(
					'xl:max-h-[calc(var(--safe-h-dvh)-17.5rem)] xl:p-2',
					isShowBackgroundImage && 'bg-content1/40 backdrop-blur'
				),
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
						{(columnKey) => <TableCell>{renderTableCell(item, columnKey as TTableColumnKey)}</TableCell>}
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
});
