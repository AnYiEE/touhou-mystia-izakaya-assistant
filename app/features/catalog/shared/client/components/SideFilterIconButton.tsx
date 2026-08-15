'use client';

import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { Select, SelectItem, type SelectProps } from '@heroui/select';
import { type Selection } from '@heroui/table';
import { cn } from '@heroui/theme';
import { memo, useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import FontAwesomeIconButton, {
	type IFontAwesomeIconButtonProps,
} from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import {
	selectionToKnownValues,
	toSelectionKeySet,
} from '@/design/ui/components/selectionKeys';
import Tooltip from '@/design/ui/components/tooltip';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import {
	COOKER_SERIES_LABEL_MAP,
	COOKER_TYPE_LABEL_MAP,
} from '@/domain/data/cookers/cookerFacts';
import type { TCookerSeriesId } from '@/domain/data/cookers/types';
import { INGREDIENT_TYPE_MAP } from '@/domain/data/ingredients/ingredientFacts';
import type { TIngredientTypeId } from '@/domain/data/ingredients/types';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TSpriteTarget } from '@/domain/data/sprites/types';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import Sprite from './Sprite';

interface ISelectConfigItemBase extends Pick<
	SelectProps,
	'label' | 'selectionMode'
> {}

type TSelectionSetter = (...arguments_: never[]) => void;

interface IStringSelectConfigItem extends ISelectConfigItemBase {
	items: Array<{ name?: string; value: number | string }>;
	selectedKeys: string[];
	setSelectedKeys: TSelectionSetter;
	spriteTarget?: never;
	valueType?: 'dlc' | 'ingredientType' | 'map';
}

interface INumberSelectConfigItem extends ISelectConfigItemBase {
	items: Array<ValueCollection<number>>;
	selectedKeys: number[];
	setSelectedKeys: TSelectionSetter;
	spriteTarget?: never;
	valueType: 'beverageTag' | 'cookerSeries' | 'cookerType' | 'foodTag';
}

interface IRecordSelectOption {
	name: string;
	recordId: number;
	value: number;
}

interface IRecordSelectConfigItem extends ISelectConfigItemBase {
	items: IRecordSelectOption[];
	selectedKeys: number[];
	setSelectedKeys: TSelectionSetter;
	spriteTarget: TSpriteTarget;
	valueType?: never;
}

type ISelectConfigItem =
	| INumberSelectConfigItem
	| IRecordSelectConfigItem
	| IStringSelectConfigItem;

const NUMERIC_SELECT_VALUE_TYPES: ReadonlyArray<string> = [
	'beverageTag',
	'cookerSeries',
	'cookerType',
	'foodTag',
];

const RECORD_SELECT_ITEM_CLASS_NAMES = {
	base: '[&>span]:inline-flex',
} as const;

function writeSelectedKeys(
	config: ISelectConfigItem,
	values: number[] | string[]
) {
	// The discriminated config couples each concrete store setter to its own
	// option values; TypeScript cannot express that existential relationship.
	const write = config.setSelectedKeys as unknown as (
		selectedKeys: number[] | string[]
	) => void;
	write(values);
}

export type TSelectConfig = ISelectConfigItem[];

function renderSelectItem(
	config: ISelectConfigItem,
	item: IRecordSelectOption | ValueCollection<number | string>
) {
	if (config.spriteTarget !== undefined) {
		const { name, recordId, value } = item as IRecordSelectOption;
		const sprite =
			config.spriteTarget === 'normal_guest' ? (
				<div className="h-6 w-6 overflow-hidden rounded-full">
					<Sprite
						target={config.spriteTarget}
						recordId={recordId as never}
						size={2.15}
						className="-translate-x-[0.315rem] -translate-y-px"
					/>
				</div>
			) : config.spriteTarget === 'special_guest' ? (
				<Sprite
					target={config.spriteTarget}
					recordId={recordId as never}
					size={1.5}
					className="rounded-full"
				/>
			) : (
				<Sprite
					target={config.spriteTarget}
					recordId={recordId as never}
					size={1}
				/>
			);

		return (
			<SelectItem
				key={value.toString()}
				textValue={name}
				classNames={RECORD_SELECT_ITEM_CLASS_NAMES}
			>
				<span className="inline-flex items-center">
					{sprite}
					<span className="ml-1">{name}</span>
				</span>
			</SelectItem>
		);
	}

	const { name, value } = item as { name?: string; value: number | string };
	const label =
		name ??
		(config.valueType === 'beverageTag'
			? BEVERAGE_TAG_MAP[Number(value) as TBeverageTagId]
			: config.valueType === 'cookerSeries'
				? COOKER_SERIES_LABEL_MAP[Number(value) as TCookerSeriesId]
				: config.valueType === 'cookerType'
					? COOKER_TYPE_LABEL_MAP[
							Number(value) as keyof typeof COOKER_TYPE_LABEL_MAP
						]
					: config.valueType === 'dlc'
						? DLC_LABEL_MAP[value as TDlc].label
						: config.valueType === 'ingredientType'
							? INGREDIENT_TYPE_MAP[
									Number(value) as TIngredientTypeId
								]
							: config.valueType === 'foodTag'
								? FOOD_TAG_MAP[Number(value) as TFoodTagId]
								: config.valueType === 'map'
									? MAP_FACTS[value as TMapLabel].label
									: value.toString());

	return <SelectItem key={value.toString()}>{label}</SelectItem>;
}

interface IProps extends Omit<
	IFontAwesomeIconButtonProps,
	'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'
> {
	selectConfig: TSelectConfig;
}

export default memo<IProps>(function SideFilterIconButton({
	className,
	selectConfig,
	...props
}) {
	const { isHighAppearance } = useDesignPreferences();
	const selectMotionProps = useMotionProps('select');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const filteredSelectConfig = useMemo(
		() =>
			selectConfig.filter(
				({ items, valueType }) =>
					!(valueType === 'dlc' && items.length <= 1)
			),
		[selectConfig]
	);

	const hasFilter = useMemo(
		() =>
			filteredSelectConfig.some(
				({ selectedKeys }) => selectedKeys.length > 0
			),
		[filteredSelectConfig]
	);

	const selectPopoverProps = useMemo(
		() => ({ motionProps: selectMotionProps, shouldCloseOnScroll: false }),
		[selectMotionProps]
	);

	const selectClassNames = useMemo(
		() => ({
			listboxWrapper: cn(
				'[&_li]:transition-background motion-reduce:[&_li]:transition-none',
				{
					'focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40':
						isHighAppearance,
				}
			),
			popoverContent: cn({
				'bg-content1/70 backdrop-blur-lg': isHighAppearance,
			}),
			trigger: cn(
				'transition-background motion-reduce:transition-none',
				isHighAppearance
					? 'bg-default/40 data-[hover=true]:bg-default-400/40'
					: 'bg-default-200 data-[hover=true]:bg-default'
			),
		}),
		[isHighAppearance]
	);

	const handleSelectionChange = useCallback(
		(config: ISelectConfigItem) => (key: Selection) => {
			if (config.spriteTarget !== undefined) {
				const values = selectionToKnownValues(
					key,
					new Map(
						config.items.map(({ value }) => [
							value.toString(),
							value,
						])
					)
				);
				if (values === null) {
					return;
				}
				const order = new Map(
					config.items.map(({ value }, index) => [value, index])
				);
				writeSelectedKeys(
					config,
					values.sort(
						(a, b) =>
							(order.get(a) ?? Infinity) -
							(order.get(b) ?? Infinity)
					)
				);
				return;
			}
			if (NUMERIC_SELECT_VALUE_TYPES.includes(config.valueType ?? '')) {
				const values = selectionToKnownValues(
					key,
					new Map(
						config.items.map(({ value }) => [
							value.toString(),
							Number(value),
						])
					)
				);
				if (values === null) {
					return;
				}
				writeSelectedKeys(
					config,
					values.sort((a, b) => a - b)
				);
				return;
			}
			const values = selectionToKnownValues(
				key,
				new Map(
					config.items.map(({ value }) => [
						value.toString(),
						value.toString(),
					])
				)
			);
			if (values !== null) {
				writeSelectedKeys(config, values.sort(pinyinSort));
			}
		},
		[]
	);

	const filteredSelectEntries = useMemo(
		() =>
			filteredSelectConfig.map((config) => ({
				config,
				onSelectionChange: handleSelectionChange(config),
				selectedKeys: toSelectionKeySet(config.selectedKeys),
			})),
		[filteredSelectConfig, handleSelectionChange]
	);

	const handleResetFilters = useCallback(() => {
		vibrate();
		filteredSelectConfig.forEach((config) => {
			if (config.selectedKeys.length > 0) {
				writeSelectedKeys(config, []);
			}
		});
	}, [filteredSelectConfig, vibrate]);

	if (checkLengthEmpty(filteredSelectConfig)) {
		return null;
	}

	const content = `筛选（${hasFilter ? '已' : '未'}激活）`;

	return (
		<Popover
			shouldBlockScroll
			/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
			// backdrop="opaque"
			placement="left"
			onOpenChange={vibrate}
		>
			<Tooltip showArrow content={content} placement="left">
				<span className="flex">
					<PopoverTrigger>
						<FontAwesomeIconButton
							color={hasFilter ? 'warning' : 'primary'}
							icon={faFilter}
							variant="shadow"
							aria-label={content}
							className={cn(
								hasFilter ? 'bg-warning-600' : 'bg-primary-600',
								className
							)}
							{...props}
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent className="max-h-[calc(var(--safe-h-dvh)-5.5rem)] w-64 overflow-hidden">
				<div className="flex min-h-0 w-full flex-col gap-1">
					<div className="min-h-0 space-y-1 overflow-y-auto scrollbar-hide">
						{filteredSelectEntries.map(
							(
								{ config, onSelectionChange, selectedKeys },
								index
							) => {
								const { items, label, selectionMode } = config;
								return (
									<Select<
										| IRecordSelectOption
										| ValueCollection<number | string>
									>
										key={index}
										disableAnimation={isReducedMotion}
										isVirtualized={false}
										items={items}
										label={label}
										selectedKeys={selectedKeys}
										selectionMode={
											selectionMode ?? 'multiple'
										}
										size="sm"
										onSelectionChange={onSelectionChange}
										popoverProps={selectPopoverProps}
										classNames={selectClassNames}
									>
										{(item) =>
											renderSelectItem(config, item)
										}
									</Select>
								);
							}
						)}
					</div>
					<Button
						fullWidth
						className="shrink-0"
						color="danger"
						isDisabled={!hasFilter}
						size="sm"
						variant="flat"
						onPress={handleResetFilters}
					>
						重置当前筛选
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
});
