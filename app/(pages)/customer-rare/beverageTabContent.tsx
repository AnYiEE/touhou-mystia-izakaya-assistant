import {useCallback, useMemo} from 'react';

import {useVibrate, useViewInNewWindow} from '@/hooks';

import {Autocomplete, AutocompleteItem} from '@heroui/autocomplete';
import {Pagination} from '@heroui/pagination';
import {Select, SelectItem} from '@heroui/select';
import {type SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/table';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faMagnifyingGlass, faPlus, faTags} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
	useMotionProps,
	useReducedMotion,
} from '@/design/ui/components';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Placeholder from '@/components/placeholder';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {beverageTableColumns as tableColumns} from './constants';
import type {ITableColumn, ITableSortDescriptor, TBeverageWithSuitability, TBeveragesWithSuitability} from './types';
import {CUSTOMER_RARE_TAG_STYLE, LABEL_MAP} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {
	checkArraySubsetOf,
	checkEmpty,
	copyArray,
	numberSort,
	pinyinSort,
	processPinyin,
	toArray,
	toSet,
} from '@/utilities';

export type TTableColumnKey = 'beverage' | 'price' | 'suitability' | 'action';
export type TTableColumns = ITableColumn<TTableColumnKey>[];

type TTableSortKey = Exclude<TTableColumnKey, 'action'>;
export type TTableSortDescriptor = ITableSortDescriptor<TTableSortKey>;

export default function BeverageTabContent() {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const selectedCustomerBeverageTag = customerStore.shared.customer.select.beverageTag.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const selectedDlcs = customerStore.beverageTableDlcs.use();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_customer = customerStore.instances.customer.get();

	const allBeverageNames = customerStore.beverage.names.get();
	const allBeverageDlcs = customerStore.beverage.dlcs.get();
	const allBeverageTags = customerStore.beverage.tags.get();

	const searchValue = customerStore.shared.beverage.searchValue.use();
	const hasNameFilter = Boolean(searchValue);

	const tableCurrentPage = customerStore.shared.beverage.page.use();
	const tableRowsPerPage = customerStore.beverageTableRows.use();
	const tableRowsPerPageNumber = customerStore.persistence.beverage.table.rows.use();
	const tableSelectableRows = customerStore.shared.beverage.selectableRows.get();
	const tableSortDescriptor = customerStore.persistence.beverage.table.sortDescriptor.use();
	const tableVisibleColumns = customerStore.beverageTableColumns.use();

	const filteredData = useMemo<TBeveragesWithSuitability>(() => {
		const {data} = instance_beverage;

		if (currentCustomerName === null) {
			return data.map((item) => ({
				...item,
				matchedTags: [],
				suitability: 0,
			}));
		}

		const beverageTags = instance_customer.getPropsByName(currentCustomerName, 'beverageTags');

		const dataWithRealSuitability = data.map((item) => {
			const {suitability, tags: matchedTags} = instance_beverage.getCustomerSuitability(item.name, beverageTags);

			return {
				...item,
				matchedTags,
				suitability,
			};
		});

		if (checkEmpty(selectedCustomerBeverageTag) && checkEmpty(selectedDlcs) && !hasNameFilter) {
			return dataWithRealSuitability;
		}

		const searchValueLowerCase = searchValue.toLowerCase();

		return dataWithRealSuitability.filter(({dlc, name, pinyin, tags}) => {
			const {pinyinFirstLetters, pinyinWithoutTone} = processPinyin(pinyin);

			const isNameMatched = hasNameFilter
				? name.toLowerCase().includes(searchValueLowerCase) ||
					pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
					pinyinFirstLetters.includes(searchValueLowerCase)
				: true;
			const isDlcMatched = checkEmpty(selectedDlcs) || selectedDlcs.has(dlc.toString());
			const isTagsMatched =
				checkEmpty(selectedCustomerBeverageTag) ||
				checkArraySubsetOf(toArray(selectedCustomerBeverageTag), tags);

			return isNameMatched && isDlcMatched && isTagsMatched;
		});
	}, [
		currentCustomerName,
		hasNameFilter,
		instance_beverage,
		instance_customer,
		searchValue,
		selectedCustomerBeverageTag,
		selectedDlcs,
	]);

	const sortedData = useMemo(() => {
		const {column, direction} = tableSortDescriptor;
		const isAscending = direction === 'ascending';

		switch (column) {
			case 'beverage':
				return copyArray(filteredData).sort(({name: a}, {name: b}) =>
					isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
				);
			case 'price':
				return copyArray(filteredData).sort(({price: a}, {price: b}) =>
					isAscending ? numberSort(a, b) : numberSort(b, a)
				);
			case 'suitability':
				return copyArray(filteredData).sort(({suitability: a}, {suitability: b}) =>
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

	const tableSelectedKeys = toSet([currentBeverageName ?? '']);

	const renderTableCell = useCallback(
		(data: TBeverageWithSuitability, columnKey: TTableColumnKey) => {
			const {matchedTags, name, price, suitability, tags: beverageTags} = data;

			if (currentCustomerName === null) {
				return null;
			}

			const {beverage: beverageTagStyle} = CUSTOMER_RARE_TAG_STYLE;

			const tags = (
				<TagGroup>
					{beverageTags.map((tag, index) => {
						const isTagMatched = matchedTags.includes(tag);
						const tagStyle = isTagMatched ? beverageTagStyle : {};
						const tagType = isTagMatched ? 'positive' : null;
						return (
							<Tags.Tag
								key={index}
								tag={tag}
								tagStyle={tagStyle}
								tagType={tagType}
								className={cn({
									'opacity-50': !isTagMatched,
								})}
							/>
						);
					})}
				</TagGroup>
			);

			switch (columnKey) {
				case 'beverage': {
					const label = `点击：在新窗口中查看酒水【${name}】的详情`;
					return (
						<div className="flex items-center gap-2">
							<Tooltip showArrow content={label} placement="right" size="sm">
								<Sprite
									target="beverage"
									name={name}
									size={2}
									onPress={() => {
										openWindow('beverages', name);
									}}
									aria-label={label}
									role="button"
								/>
							</Tooltip>
							<div className="inline-flex flex-1 items-center whitespace-nowrap">
								<span className="text-small font-medium">{name}</span>
								<span className="ml-0.5">
									<Popover showArrow offset={10} size="sm">
										<Tooltip showArrow content={tags} offset={5} placement="right" size="sm">
											<span className="inline-flex">
												<PopoverTrigger>
													<FontAwesomeIconButton
														icon={faTags}
														variant="light"
														aria-label="酒水标签"
														className="inline h-4 w-4 min-w-0 scale-75 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover"
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
		[currentCustomerName, openWindow, vibrate]
	);

	const tableToolbar = useMemo(
		() => (
			<div className="flex flex-col gap-2">
				<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
					<div className="flex flex-1 items-end gap-3">
						<Autocomplete
							allowsCustomValue
							defaultItems={allBeverageNames}
							disableAnimation={isReducedMotion}
							inputValue={searchValue}
							isVirtualized={false}
							placeholder="名称"
							size="sm"
							startContent={<FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none" />}
							variant="flat"
							onInputChange={(value) => {
								vibrate(!value);
								customerStore.onBeverageTableSearchValueChange(value);
							}}
							aria-label="选择或输入酒水名称"
							title="选择或输入酒水名称"
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: cn(
									'data-[slot="input-wrapper"]:[&_div]:!bg-default/40 data-[slot="input-wrapper"]:data-[hover=true]:[&_div]:opacity-hover data-[slot="input-wrapper"]:[&_div]:transition-opacity data-[slot="input-wrapper"]:[&_div]:!duration-250 motion-reduce:data-[slot="input-wrapper"]:[&_div]:transition-none',
									{
										'backdrop-blur': isHighAppearance,
									}
								),
								listboxWrapper:
									'[&_li]:transition-background data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
								popoverContent: cn({
									'bg-content1/70 backdrop-blur-lg': isHighAppearance,
								}),
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
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={allBeverageTags}
							placeholder="标签"
							selectedKeys={selectedCustomerBeverageTag}
							size="sm"
							startContent={<FontAwesomeIcon icon={faTags} />}
							variant="flat"
							onSelectionChange={customerStore.onBeverageTableSelectedTagsChange}
							aria-label="选择顾客所点单的酒水标签"
							title="选择顾客所点单的酒水标签"
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: 'w-2/3 md:w-full',
								listboxWrapper:
									'[&_li]:transition-background focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
								popoverContent: cn({
									'bg-content1/70 backdrop-blur-lg': isHighAppearance,
								}),
								trigger: cn(
									'bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
									{
										'backdrop-blur': isHighAppearance,
									}
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
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{
											'backdrop-blur': isHighAppearance,
											'ring-2 ring-default': !checkEmpty(selectedDlcs),
										}
									)}
								>
									DLC
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								closeOnSelect={false}
								items={allBeverageDlcs}
								selectedKeys={selectedDlcs}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={customerStore.onBeverageTableSelectedDlcsChange}
								aria-label="选择特定DLC中的酒水"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
							>
								{({value}) => (
									<DropdownItem key={value} textValue={value.toString()}>
										{value || LABEL_MAP.dlc0}
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
						<Dropdown showArrow>
							<DropdownTrigger>
								<Button
									endContent={<FontAwesomeIcon icon={faChevronDown} />}
									size="sm"
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{
											'backdrop-blur': isHighAppearance,
										}
									)}
								>
									条目
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								disallowEmptySelection
								closeOnSelect={false}
								disabledKeys={['action', 'beverage'] satisfies TTableColumnKey[]}
								items={tableColumns}
								selectedKeys={tableVisibleColumns}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={customerStore.beverageTableColumns.set}
								aria-label="选择表格所显示的列"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
							>
								{({key, label}) => <DropdownItem key={key}>{label}</DropdownItem>}
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>
				<div className="flex items-center justify-between text-small text-default-700">
					<span>总计{filteredData.length}种酒水</span>
					<label className="flex items-center gap-2">
						<span className="cursor-auto whitespace-nowrap">表格行数</span>
						<Select
							disallowEmptySelection
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={tableSelectableRows}
							selectedKeys={tableRowsPerPage}
							size="sm"
							variant="flat"
							onSelectionChange={customerStore.onBeverageTableRowsPerPageChange}
							aria-label="选择表格每页最大行数"
							title="选择表格每页最大行数"
							popoverProps={{
								motionProps: popoverMotionProps,
								shouldCloseOnScroll: false,
							}}
							classNames={{
								base: 'min-w-16',
								listboxWrapper:
									'[&_li]:transition-background focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
								popoverContent: cn('min-w-20', {
									'bg-content1/70 backdrop-blur-lg': isHighAppearance,
								}),
								trigger: cn(
									'h-6 min-h-6 bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
									{
										'backdrop-blur': isHighAppearance,
									}
								),
								value: '!text-default-700',
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
			isHighAppearance,
			isReducedMotion,
			popoverMotionProps,
			searchValue,
			selectedCustomerBeverageTag,
			selectedDlcs,
			tableRowsPerPage,
			tableSelectableRows,
			tableVisibleColumns,
			vibrate,
		]
	);

	const tablePagination = useMemo(
		() => (
			<div className="flex justify-center pt-2">
				{!checkEmpty(tableCurrentPageItems) && (
					<Pagination
						/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/4275} is fixed. */
						// showControls
						showShadow
						disableAnimation={isReducedMotion}
						size="sm"
						page={tableCurrentPage}
						total={tableTotalPages}
						onChange={(page) => {
							vibrate();
							customerStore.onBeverageTablePageChange(page);
						}}
						classNames={{
							item: cn('bg-default/40', {
								'backdrop-blur': isHighAppearance,
							}),
						}}
					/>
				)}
			</div>
		),
		[isHighAppearance, isReducedMotion, tableCurrentPage, tableCurrentPageItems, tableTotalPages, vibrate]
	);

	return (
		<Table
			isHeaderSticky
			bottomContent={tablePagination}
			bottomContentPlacement="outside"
			disableAnimation={isReducedMotion}
			selectedKeys={tableSelectedKeys}
			selectionMode="single"
			sortDescriptor={tableSortDescriptor as SortDescriptor}
			topContent={tableToolbar}
			topContentPlacement="outside"
			onSortChange={(config) => {
				vibrate();
				customerStore.onBeverageTableSortChange(config as TTableSortDescriptor);
			}}
			aria-label="酒水选择表格"
			classNames={{
				base: 'gap-2',
				td: 'before:bg-default-200/70 before:transition-colors-opacity motion-reduce:before:transition-none',
				th: cn('bg-default-200/70', {
					'backdrop-blur-sm': isHighAppearance,
				}),
				thead: '[&>tr[tabindex="-1"]]:invisible',
				wrapper: cn('bg-content1/40 xl:max-h-[calc(var(--safe-h-dvh)-17.5rem)] xl:p-2', {
					'backdrop-blur': isHighAppearance,
				}),
			}}
		>
			<TableHeader columns={tableHeaderColumns}>
				{({key, label, sortable}) => (
					<TableColumn key={key} align={key === 'action' ? 'center' : 'start'} allowsSorting={sortable}>
						{label}
					</TableColumn>
				)}
			</TableHeader>
			<TableBody emptyContent={<Placeholder>数据为空</Placeholder>} items={tableCurrentPageItems}>
				{(item) => (
					<TableRow key={item.name}>
						{(columnKey) => <TableCell>{renderTableCell(item, columnKey as TTableColumnKey)}</TableCell>}
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
