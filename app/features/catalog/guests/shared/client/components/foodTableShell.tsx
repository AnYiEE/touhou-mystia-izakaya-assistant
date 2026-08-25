import {
	type SortDescriptor,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from '@heroui/table';
import { cn } from '@heroui/theme';
import { type ReactNode, memo, useMemo } from 'react';

import Pagination from '@/design/ui/components/pagination';
import Placeholder from '@/design/ui/components/placeholder';

import type { TFoodSuitabilityRow } from '@/features/catalog/guests/shared/contracts';
import {
	type ITableColumn,
	type TFoodTableColumnKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

const FOOD_TABLE_EMPTY_MESSAGE_MAP = {
	default: '数据为空',
	popularTrendRequired: '请您先在设置中指定「流行趋势」',
	popularTrendUnset: '选定的筛选条件包含流行趋势标签',
} as const;

interface IProps {
	hasUnsetPopularTrendFilter: boolean;
	headerColumns: Array<ITableColumn<TFoodTableColumnKey>>;
	isHighAppearance: boolean;
	isReducedMotion: boolean;
	items: TFoodSuitabilityRow[];
	onPageChange: (page: number) => void;
	onSortChange: (config: SortDescriptor) => void;
	page: number;
	renderCell: (
		item: TFoodSuitabilityRow,
		columnKey: TFoodTableColumnKey
	) => ReactNode;
	selectedKeys: Set<number>;
	sortDescriptor: SortDescriptor;
	topContent: ReactNode;
	totalPages: number;
}

export default memo<IProps>(function FoodTableShell({
	hasUnsetPopularTrendFilter,
	headerColumns,
	isHighAppearance,
	isReducedMotion,
	items,
	onPageChange,
	onSortChange,
	page,
	renderCell,
	selectedKeys,
	sortDescriptor,
	topContent,
	totalPages,
}) {
	const tableSelectedKeys = useMemo(
		() => new Set(Array.from(selectedKeys, String)),
		[selectedKeys]
	);
	const paginationClassNames = useMemo(
		() => ({
			item: cn('bg-default/40', { 'backdrop-blur': isHighAppearance }),
		}),
		[isHighAppearance]
	);
	const tableClassNames = useMemo(
		() => ({
			base: 'gap-2',
			td: '!px-1 [&[data-key$=cookerType]]:hidden [&[data-key$=ingredient]]:hidden before:bg-default-200/70 before:transition-colors-opacity md:!px-3 md:[&[data-key$=cookerType]]:table-cell md:[&[data-key$=ingredient]]:table-cell motion-reduce:before:transition-none',
			th: cn(
				'bg-default-200/70 !px-1 md:!px-3 [&[data-key$=cookerType]]:hidden md:[&[data-key$=cookerType]]:table-cell [&[data-key$=ingredient]]:hidden md:[&[data-key$=ingredient]]:table-cell',
				{ 'backdrop-blur-sm': isHighAppearance }
			),
			thead: '[&>tr[tabindex="-1"]]:invisible',
			wrapper: cn(
				'bg-content1/40 !p-1 md:!p-4 xl:max-h-[calc(var(--safe-h-dvh)-17.5rem)] xl:!p-2',
				{ 'backdrop-blur': isHighAppearance }
			),
		}),
		[isHighAppearance]
	);

	return (
		<Table
			isHeaderSticky
			bottomContent={
				<div className="flex justify-center pt-2">
					{!checkLengthEmpty(items) && (
						<Pagination
							/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/4275} is fixed. */
							// showControls
							showShadow
							size="sm"
							page={page}
							total={totalPages}
							onChange={onPageChange}
							classNames={paginationClassNames}
						/>
					)}
				</div>
			}
			bottomContentPlacement="outside"
			disableAnimation={isReducedMotion}
			selectedKeys={tableSelectedKeys}
			selectionMode="single"
			sortDescriptor={sortDescriptor}
			topContent={topContent}
			topContentPlacement="outside"
			onSortChange={onSortChange}
			aria-label="料理选择表格"
			classNames={tableClassNames}
		>
			<TableHeader columns={headerColumns}>
				{({ key, label, sortable }) => (
					<TableColumn
						key={key}
						align={key === 'action' ? 'center' : 'start'}
						allowsSorting={sortable}
					>
						{label}
					</TableColumn>
				)}
			</TableHeader>
			<TableBody
				emptyContent={
					hasUnsetPopularTrendFilter ? (
						<Placeholder className="space-y-2">
							<p>
								{FOOD_TABLE_EMPTY_MESSAGE_MAP.popularTrendUnset}
							</p>
							<p>
								{
									FOOD_TABLE_EMPTY_MESSAGE_MAP.popularTrendRequired
								}
							</p>
						</Placeholder>
					) : (
						<Placeholder>
							{FOOD_TABLE_EMPTY_MESSAGE_MAP.default}
						</Placeholder>
					)
				}
				items={items}
			>
				{(item) => (
					<TableRow key={String(item.recipeId)}>
						{(columnKey) => (
							<TableCell>
								{renderCell(
									item,
									columnKey as TFoodTableColumnKey
								)}
							</TableCell>
						)}
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
});
