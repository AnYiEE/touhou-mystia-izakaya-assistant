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

import {type TTableColumnKey, type TTableSortDescriptor} from '@/(pages)/customer-rare/beverageTabContent';
import {beverageTableColumns as tableColumns} from './constants';
import type {TBeverageWithSuitability, TBeveragesWithSuitability} from './types';
import {CUSTOMER_NORMAL_TAG_STYLE} from '@/data';
import {customerNormalStore as store} from '@/stores';
import {checkA11yConfirmKey, numberSort, pinyinSort, processPinyin} from '@/utils';

export type {TTableSortDescriptor} from '@/(pages)/customer-rare/beverageTabContent';

interface IProps {}

export default memo(
	forwardRef<HTMLTableElement | null, IProps>(function BeverageTabContent(_props, ref) {
		const openWindow = useViewInNewWindow();

		const currentCustomerName = store.shared.customer.name.use();
		const selectedCustomerBeverageTags = store.shared.customer.beverageTags.use();

		const currentBeverageName = store.shared.beverage.name.use();
		const selectedDlcs = store.shared.beverage.dlcs.use();

		const instance_beverage = store.instances.beverage.get();
		const instance_customer = store.instances.customer.get();

		const allBeverageNames = store.beverage.names.get();
		const allBeverageDlcs = store.beverage.dlcs.get();
		const allBeverageTags = store.beverage.tags.get();

		const searchValue = store.shared.beverage.searchValue.use();
		const hasNameFilter = Boolean(searchValue);

		const tableCurrentPage = store.shared.beverage.page.use();
		const tableRowsPerPage = store.recipeTableRows.use();
		const tableRowsPerPageNumber = store.persistence.beverage.table.rows.use();
		const tableSelectableRows = store.shared.beverage.selectableRows.get();
		const tableSortDescriptor = store.shared.beverage.sortDescriptor.use();
		const tableVisibleColumns = store.beverageTableColumns.use();

		const filteredData = useMemo(() => {
			const data = instance_beverage.data as TBeveragesWithSuitability;

			if (!currentCustomerName) {
				return data.map((item) => ({
					...item,
					matchedTags: [] as string[],
					suitability: 0,
				}));
			}

			const {beverageTags} = instance_customer.getPropsByName(currentCustomerName);

			const dataWithRealSuitability = data.map((item) => {
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
						? [...selectedCustomerBeverageTags].every((tag) => (tags as string[]).includes(tag as string))
						: true;

				return isNameMatched && isDlcMatched && isTagsMatched;
			});
		}, [
			currentCustomerName,
			hasNameFilter,
			instance_beverage,
			instance_customer,
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

		const tableTotalPages = useMemo(
			() => Math.ceil(filteredData.length / tableRowsPerPageNumber),
			[filteredData.length, tableRowsPerPageNumber]
		);

		const tableSelectedKeys = new Set([currentBeverageName ?? '']);

		const renderTableCell = useCallback(
			(data: TBeverageWithSuitability, columnKey: TTableColumnKey) => {
				const {name, price, suitability, matchedTags, tags: beverageTags} = data;

				if (!currentCustomerName) {
					return null;
				}

				const {beverage: beverageTagStyle} = CUSTOMER_NORMAL_TAG_STYLE;

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
									<span className="text-small font-medium">{name}</span>
									<span className="-ml-2">
										<Popover showArrow offset={10} size="sm">
											<Tooltip showArrow content={tags} offset={-2} placement="right" size="sm">
												<span>
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
					}
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
								<Tooltip showArrow content="选择此项" placement="left" size="sm">
									<Button
										isIconOnly
										size="sm"
										variant="light"
										onPress={() => {
											store.onBeverageTableAction(name);
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
			[currentCustomerName, openWindow]
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
								startContent={
									<FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none" />
								}
								variant="flat"
								onClear={store.clearBeverageTableSearchValue}
								onInputChange={store.onBeverageTableSearchValueChange}
								aria-label="选择或输入酒水名称"
								title="选择或输入酒水名称"
							>
								{({value}) => <AutocompleteItem key={value}>{value}</AutocompleteItem>}
							</Autocomplete>
							<Select
								items={allBeverageTags}
								defaultSelectedKeys={selectedCustomerBeverageTags}
								selectedKeys={selectedCustomerBeverageTags}
								placeholder="标签"
								size="sm"
								startContent={<FontAwesomeIcon icon={faTags} />}
								variant="flat"
								onSelectionChange={store.onBeverageTableSelectedTagsChange}
								aria-label="选择顾客所点单的酒水标签"
								title="选择顾客所点单的酒水标签"
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
									onSelectionChange={store.onBeverageTableSelectedDlcsChange}
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
						<label className="flex items-center gap-2">
							<span className="cursor-auto whitespace-nowrap">表格行数</span>
							<Select
								items={tableSelectableRows}
								defaultSelectedKeys={tableRowsPerPage}
								selectedKeys={tableRowsPerPage}
								size="sm"
								variant="flat"
								onSelectionChange={store.onBeverageTableRowsPerPageChange}
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
					<Pagination
						showShadow
						size="sm"
						page={tableCurrentPage}
						total={tableTotalPages}
						onChange={store.onBeverageTablePageChange}
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
					store.onBeverageTableSortChange(config as TTableSortDescriptor);
				}}
				aria-label="酒水选择表格"
				classNames={{
					wrapper: 'xl:max-h-[calc(var(--safe-h-dvh)-17.5rem)]',
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
