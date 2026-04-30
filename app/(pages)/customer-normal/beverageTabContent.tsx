import { useCallback, useMemo } from 'react';

import { useVibrate, useViewInNewWindow } from '@/hooks';

import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Select, SelectItem } from '@heroui/select';
import { type SortDescriptor } from '@heroui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faMagnifyingGlass,
	faPlus,
	faTags,
} from '@fortawesome/free-solid-svg-icons';

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

import BeverageTableShell from '@/(pages)/customer-shared/beverageTableShell';
import TagGroup from '@/(pages)/customer-shared/tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import { beverageTableColumns } from '@/(pages)/customer-shared/constants';
import type { TBeverageTableColumnKey } from '@/(pages)/customer-shared/types';
import { CUSTOMER_NORMAL_TAG_STYLE, DLC_LABEL_MAP } from '@/data';
import { customerNormalStore as customerStore, globalStore } from '@/stores';
import { checkLengthEmpty, toSet } from '@/utilities';
import {
	type ITableSortDescriptor,
	type TBeverageSuitabilityRow,
	type TBeverageTableSortKey,
} from '@/utils/customer/shared';

export default function BeverageTabContent() {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const selectedCustomerBeverageTag =
		customerStore.shared.customer.select.beverageTag.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const selectedDlcs = customerStore.beverageTableDlcs.use();

	const availableBeverageDlcs = customerStore.availableBeverageDlcs.use();
	const availableBeverageNames = customerStore.availableBeverageNames.use();
	const availableBeverageTags = customerStore.availableBeverageTags.use();

	const searchValue = customerStore.shared.beverage.searchValue.use();

	const tableCurrentPage = customerStore.shared.beverage.table.page.use();
	const tableRowsPerPage = customerStore.shared.beverage.table.rows.use();
	const tableRowsPerPageNumber =
		customerStore.shared.beverage.table.row.use();
	const tableSelectableRows =
		customerStore.shared.beverage.table.selectableRows.get();
	const tableSortDescriptor =
		customerStore.persistence.beverage.table.sortDescriptor.use();
	const tableVisibleColumns =
		customerStore.shared.beverage.table.columns.use();

	const tableCurrentPageItems = customerStore.beverageTablePagedRows.use();
	const tableSortedRows = customerStore.beverageTableSortedRows.use();

	const tableHeaderColumns = useMemo(
		() =>
			beverageTableColumns.filter(({ key }) =>
				tableVisibleColumns.has(key)
			),
		[tableVisibleColumns]
	);

	const tableTotalPages = Math.ceil(
		tableSortedRows.length / tableRowsPerPageNumber
	);

	const tableSelectedKeys = toSet(currentBeverageName ?? '');

	const renderTableCell = useCallback(
		(
			beverageData: TBeverageSuitabilityRow,
			columnKey: TBeverageTableColumnKey
		) => {
			const {
				matchedTags,
				name,
				price,
				suitability,
				tags: beverageTags,
			} = beverageData;

			if (currentCustomerName === null) {
				return null;
			}

			const { beverage: beverageTagStyle } = CUSTOMER_NORMAL_TAG_STYLE;

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
								className={cn({ 'opacity-50': !isTagMatched })}
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
							<Tooltip
								showArrow
								content={label}
								placement="right"
								size="sm"
							>
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
								<span className="text-small font-medium">
									{name}
								</span>
								<span className="ml-0.5">
									<Popover showArrow offset={10} size="sm">
										<Tooltip
											showArrow
											content={tags}
											offset={5}
											placement="right"
											size="sm"
										>
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
							<Tooltip
								showArrow
								content={label}
								placement="left"
								size="sm"
							>
								<Button
									isIconOnly
									size="sm"
									variant="light"
									onPress={() => {
										vibrate();
										customerStore.onBeverageTableAction(
											name
										);
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
							defaultItems={availableBeverageNames}
							disableAnimation={isReducedMotion}
							inputValue={searchValue}
							isVirtualized={false}
							placeholder="名称"
							size="sm"
							startContent={
								<FontAwesomeIcon
									icon={faMagnifyingGlass}
									className="pointer-events-none"
								/>
							}
							variant="flat"
							onInputChange={(value) => {
								vibrate(!value);
								customerStore.onBeverageTableSearchValueChange(
									value
								);
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
									{ 'backdrop-blur': isHighAppearance }
								),
								listboxWrapper:
									'[&_li]:transition-background data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
								popoverContent: cn({
									'bg-content1/70 backdrop-blur-lg':
										isHighAppearance,
								}),
							}}
						>
							{({ value }) => (
								<AutocompleteItem
									key={value}
									textValue={value}
									classNames={{
										base: '[&>span+span]:hidden [&>span]:inline-flex',
									}}
								>
									<span className="inline-flex items-center">
										<Sprite
											target="beverage"
											name={value}
											size={1}
										/>
										<span className="ml-1">{value}</span>
									</span>
								</AutocompleteItem>
							)}
						</Autocomplete>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={availableBeverageTags}
							placeholder="标签"
							selectedKeys={selectedCustomerBeverageTag}
							size="sm"
							startContent={<FontAwesomeIcon icon={faTags} />}
							variant="flat"
							onSelectionChange={
								customerStore.onBeverageTableSelectedTagsChange
							}
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
									'bg-content1/70 backdrop-blur-lg':
										isHighAppearance,
								}),
								trigger: cn(
									'bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
									{ 'backdrop-blur': isHighAppearance }
								),
							}}
						>
							{({ value }) => (
								<SelectItem key={value}>{value}</SelectItem>
							)}
						</Select>
					</div>
					<div className="flex w-full gap-3 md:w-auto">
						{availableBeverageDlcs.length > 1 && (
							<Dropdown showArrow>
								<DropdownTrigger>
									<Button
										endContent={
											<FontAwesomeIcon
												icon={faChevronDown}
											/>
										}
										size="sm"
										variant="light"
										className={cn(
											'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
											{
												'backdrop-blur':
													isHighAppearance,
												'ring-2 ring-default':
													!checkLengthEmpty(
														selectedDlcs
													),
											}
										)}
									>
										DLC
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									closeOnSelect={false}
									items={availableBeverageDlcs}
									selectedKeys={selectedDlcs}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={
										customerStore.onBeverageTableSelectedDlcsChange
									}
									aria-label="选择特定DLC中的酒水"
									itemClasses={{
										base: 'transition-background motion-reduce:transition-none',
									}}
								>
									{({ value }) => (
										<DropdownItem
											key={value}
											textValue={value.toString()}
										>
											{value === 0
												? DLC_LABEL_MAP[0].label
												: DLC_LABEL_MAP[value]
														.shortLabel ||
													DLC_LABEL_MAP[value].label}
										</DropdownItem>
									)}
								</DropdownMenu>
							</Dropdown>
						)}
						<Dropdown showArrow>
							<DropdownTrigger>
								<Button
									endContent={
										<FontAwesomeIcon icon={faChevronDown} />
									}
									size="sm"
									variant="light"
									className={cn(
										'bg-default/40 data-[hover=true]:bg-default/40 data-[pressed=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover',
										{ 'backdrop-blur': isHighAppearance }
									)}
								>
									条目
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								disallowEmptySelection
								closeOnSelect={false}
								disabledKeys={
									[
										'action',
										'beverage',
									] satisfies TBeverageTableColumnKey[]
								}
								items={beverageTableColumns}
								selectedKeys={tableVisibleColumns}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={
									globalStore.beverageTableColumns.set
								}
								aria-label="选择表格所显示的列"
								itemClasses={{
									base: 'transition-background motion-reduce:transition-none',
								}}
							>
								{({ key, label }) => (
									<DropdownItem key={key}>
										{label}
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>
				<div className="flex items-center justify-between text-small text-default-700">
					<span>总计{tableSortedRows.length}种酒水</span>
					<label className="flex items-center gap-2">
						<span className="cursor-auto whitespace-nowrap">
							表格行数
						</span>
						<Select
							disallowEmptySelection
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={tableSelectableRows}
							selectedKeys={tableRowsPerPage}
							size="sm"
							variant="flat"
							onSelectionChange={
								globalStore.onTableRowsPerPageChange
							}
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
									'bg-content1/70 backdrop-blur-lg':
										isHighAppearance,
								}),
								trigger: cn(
									'h-6 min-h-6 bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
									{ 'backdrop-blur': isHighAppearance }
								),
								value: '!text-default-700',
							}}
						>
							{({ value }) => (
								<SelectItem
									key={value}
									textValue={value.toString()}
								>
									{value}
								</SelectItem>
							)}
						</Select>
					</label>
				</div>
			</div>
		),
		[
			availableBeverageDlcs,
			availableBeverageNames,
			availableBeverageTags,
			isHighAppearance,
			isReducedMotion,
			popoverMotionProps,
			searchValue,
			selectedCustomerBeverageTag,
			selectedDlcs,
			tableSortedRows.length,
			tableRowsPerPage,
			tableSelectableRows,
			tableVisibleColumns,
			vibrate,
		]
	);

	return (
		<BeverageTableShell
			isHighAppearance={isHighAppearance}
			isReducedMotion={isReducedMotion}
			headerColumns={tableHeaderColumns}
			items={tableCurrentPageItems}
			onPageChange={(page) => {
				vibrate();
				customerStore.onBeverageTablePageChange(page);
			}}
			onSortChange={(config) => {
				vibrate();
				customerStore.onBeverageTableSortChange(
					config as ITableSortDescriptor<TBeverageTableSortKey>
				);
			}}
			page={tableCurrentPage}
			renderCell={renderTableCell}
			selectedKeys={tableSelectedKeys}
			sortDescriptor={tableSortDescriptor as SortDescriptor}
			topContent={tableToolbar}
			totalPages={tableTotalPages}
		/>
	);
}
