import {
	faChevronDown,
	faMagnifyingGlass,
	faPlus,
	faTags,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Select, SelectItem } from '@heroui/select';
import { type SortDescriptor } from '@heroui/table';
import { cn } from '@heroui/theme';
import { useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { BEVERAGE_TAG_MAP } from '@/domain/data/tags/tagFacts';

import BeverageTableShell from '@/features/catalog/guests/shared/client/components/beverageTableShell';
import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import type { TBeverageSuitabilityRow } from '@/features/catalog/guests/shared/contracts';
import {
	type ITableSortDescriptor,
	type TBeverageTableColumnKey,
	type TBeverageTableSortKey,
	beverageTableColumns,
} from '@/features/catalog/guests/shared/state/tableDescriptors';
import { beverageTagSelectionAdapter } from '@/features/catalog/guests/shared/state/tagSelectionAdapter';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { SPECIAL_GUEST_TAG_STYLE } from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

const BEVERAGE_AUTOCOMPLETE_ITEM_CLASS_NAMES = {
	base: '[&>span+span]:hidden [&>span]:inline-flex',
} as const;
const BEVERAGE_TABLE_DISABLED_KEYS = [
	'action',
	'beverage',
] as const satisfies ReadonlyArray<TBeverageTableColumnKey>;
const TABLE_DROPDOWN_ITEM_CLASSES = {
	base: 'transition-background motion-reduce:transition-none',
} as const;

export default function BeverageTabContent() {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const selectedGuestBeverageTag =
		specialGuestStore.shared.guest.select.beverageTag.use();
	const selectedGuestBeverageTagKeys = useMemo(
		() =>
			beverageTagSelectionAdapter.toSelectedKeys(
				selectedGuestBeverageTag
			),
		[selectedGuestBeverageTag]
	);

	const currentBeverage = specialGuestStore.shared.beverage.id.use();
	const selectedAvailabilityDlcs =
		specialGuestStore.beverageTableAvailabilityDlcs.use();

	const availableBeverageAvailabilityDlcs =
		specialGuestStore.availableBeverageAvailabilityDlcs.use();
	const availableBeverages = specialGuestStore.availableBeverages.use();
	const availableBeverageTags = specialGuestStore.availableBeverageTags.use();

	const searchValue = specialGuestStore.shared.beverage.searchValue.use();

	const tableCurrentPage = specialGuestStore.shared.beverage.table.page.use();
	const tableRowsPerPage = specialGuestStore.shared.beverage.table.rows.use();
	const tableSelectableRows =
		specialGuestStore.shared.beverage.table.selectableRows.get();
	const tableSortDescriptor =
		specialGuestStore.persistence.beverage.table.sortDescriptor.use();
	const tableVisibleColumns =
		specialGuestStore.shared.beverage.table.columns.use();

	const {
		pagedRows: tableCurrentPageItems,
		sortedRows: tableSortedRows,
		totalPages: tableTotalPages,
	} = specialGuestStore.beverageTableRows.use();

	const tableHeaderColumns = useMemo(
		() =>
			beverageTableColumns.filter(({ key }) =>
				tableVisibleColumns.has(key)
			),
		[tableVisibleColumns]
	);

	const tableSelectedKeys = useMemo(
		() => new Set(currentBeverage === null ? [] : [currentBeverage]),
		[currentBeverage]
	);

	const renderTableCell = useCallback(
		(
			beverageData: TBeverageSuitabilityRow,
			columnKey: TBeverageTableColumnKey
		) => {
			const {
				id,
				matchedTags,
				name,
				price,
				suitability,
				tags: beverageTags,
			} = beverageData;

			if (currentSpecialGuest === null) {
				return null;
			}

			const { beverage: beverageTagStyle } = SPECIAL_GUEST_TAG_STYLE;

			const tagContent = (
				<TagGroup>
					{beverageTags.map((tag) => {
						const tagName = BEVERAGE_TAG_MAP[tag];
						const isTagMatched = matchedTags.includes(tag);
						const tagStyle = isTagMatched
							? beverageTagStyle
							: undefined;
						const tagType = isTagMatched ? 'positive' : null;
						return (
							<Tags.Tag
								key={tag}
								tag={tagName}
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
						<div className="flex min-w-0 items-center gap-1 md:gap-2">
							<Tooltip
								showArrow
								content={label}
								placement="right"
								size="sm"
							>
								<Sprite
									target="beverage"
									recordId={id}
									size={2}
									onPress={() => {
										openWindow('beverages', id, name);
									}}
									aria-label={label}
									role="button"
								/>
							</Tooltip>
							<div className="inline-flex min-w-0 flex-1 items-center whitespace-nowrap">
								<span
									className={cn(
										'max-w-[76px] truncate text-small font-medium sm:max-w-max',
										tableVisibleColumns.size < 4 &&
											'max-w-max'
									)}
								>
									{name}
								</span>
								<span className="ml-0.5 shrink-0">
									<Popover showArrow offset={10} size="sm">
										<Tooltip
											showArrow
											content={tagContent}
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
										<PopoverContent>
											{tagContent}
										</PopoverContent>
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
										specialGuestStore.onBeverageTableAction(
											id
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
		[currentSpecialGuest, openWindow, tableVisibleColumns.size, vibrate]
	);

	const tableToolbar = useMemo(
		() => (
			<div className="flex flex-col gap-2">
				<div className="flex flex-col justify-between gap-x-3 gap-y-2 md:flex-row">
					<div className="flex flex-1 items-end gap-3">
						<Autocomplete
							allowsCustomValue
							defaultItems={availableBeverages}
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
								specialGuestStore.onBeverageTableSearchValueChange(
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
							{({ id, name }) => (
								<AutocompleteItem
									key={id.toString()}
									textValue={name}
									classNames={
										BEVERAGE_AUTOCOMPLETE_ITEM_CLASS_NAMES
									}
								>
									<span className="inline-flex items-center">
										<Sprite
											target="beverage"
											recordId={id}
											size={1}
										/>
										<span className="ml-1">{name}</span>
									</span>
								</AutocompleteItem>
							)}
						</Autocomplete>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={availableBeverageTags}
							placeholder="标签"
							selectedKeys={selectedGuestBeverageTagKeys}
							size="sm"
							startContent={<FontAwesomeIcon icon={faTags} />}
							variant="flat"
							onSelectionChange={
								specialGuestStore.onBeverageTableSelectedTagsChange
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
								<SelectItem key={value.toString()}>
									{BEVERAGE_TAG_MAP[value]}
								</SelectItem>
							)}
						</Select>
					</div>
					<div className="flex w-full gap-3 md:w-auto">
						{availableBeverageAvailabilityDlcs.length > 1 && (
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
														selectedAvailabilityDlcs
													),
											}
										)}
									>
										可获取于
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									closeOnSelect={false}
									items={availableBeverageAvailabilityDlcs}
									selectedKeys={selectedAvailabilityDlcs}
									selectionMode="multiple"
									variant="flat"
									onSelectionChange={
										specialGuestStore.onBeverageTableSelectedAvailabilityDlcsChange
									}
									aria-label="按可获取内容筛选酒水"
									itemClasses={TABLE_DROPDOWN_ITEM_CLASSES}
								>
									{({ value }) => (
										<DropdownItem
											key={value.toString()}
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
								disabledKeys={BEVERAGE_TABLE_DISABLED_KEYS}
								items={beverageTableColumns}
								selectedKeys={tableVisibleColumns}
								selectionMode="multiple"
								variant="flat"
								onSelectionChange={
									globalStore.beverageTableColumns.set
								}
								aria-label="选择表格所显示的列"
								itemClasses={TABLE_DROPDOWN_ITEM_CLASSES}
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
									key={value.toString()}
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
			availableBeverageAvailabilityDlcs,
			availableBeverages,
			availableBeverageTags,
			isHighAppearance,
			isReducedMotion,
			popoverMotionProps,
			searchValue,
			selectedAvailabilityDlcs,
			selectedGuestBeverageTagKeys,
			tableSortedRows.length,
			tableRowsPerPage,
			tableSelectableRows,
			tableVisibleColumns,
			vibrate,
		]
	);

	const handleTablePageChange = useCallback(
		(page: number) => {
			vibrate();
			specialGuestStore.onBeverageTablePageChange(page);
		},
		[vibrate]
	);
	const handleTableSortChange = useCallback(
		(config: SortDescriptor) => {
			vibrate();
			specialGuestStore.onBeverageTableSortChange(
				config as ITableSortDescriptor<TBeverageTableSortKey>
			);
		},
		[vibrate]
	);

	return (
		<BeverageTableShell
			isHighAppearance={isHighAppearance}
			isReducedMotion={isReducedMotion}
			headerColumns={tableHeaderColumns}
			items={tableCurrentPageItems}
			onPageChange={handleTablePageChange}
			onSortChange={handleTableSortChange}
			page={tableCurrentPage}
			renderCell={renderTableCell}
			selectedKeys={tableSelectedKeys}
			sortDescriptor={tableSortDescriptor as SortDescriptor}
			topContent={tableToolbar}
			totalPages={tableTotalPages}
		/>
	);
}
