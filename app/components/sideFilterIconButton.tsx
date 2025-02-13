'use client';

import {type Dispatch, memo, useCallback, useMemo} from 'react';

import {useVibrate} from '@/hooks';

import {type Selection} from '@heroui/table';
import {Select, SelectItem, type SelectProps} from '@heroui/select';
import {faFilter} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
	useMotionProps,
	useReducedMotion,
} from '@/design/ui/components';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';

import {LABEL_MAP} from '@/data';
import {globalStore as store} from '@/stores';
import {checkEmpty, pinyinSort, toArray} from '@/utilities';
import type {TSpriteTarget} from '@/utils/sprite/types';

interface ISelectConfigItem extends Pick<SelectProps, 'label' | 'selectionMode'> {
	items: ValueCollection<number | string>[];
	selectedKeys: string[];
	setSelectedKeys: Dispatch<ISelectConfigItem['selectedKeys']>;
	spriteTarget?: TSpriteTarget;
}
export type TSelectConfig = ISelectConfigItem[];

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	selectConfig: TSelectConfig;
}

export default memo<IProps>(function SideFilterIconButton({className, selectConfig, ...props}) {
	const selectMotionProps = useMotionProps('select');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const isHighAppearance = store.persistence.highAppearance.use();

	const hasFilter = useMemo(() => selectConfig.some(({selectedKeys}) => !checkEmpty(selectedKeys)), [selectConfig]);

	const handleSelectionChange = useCallback(
		(setSelectedKeys: ISelectConfigItem['setSelectedKeys']) => (key: Selection) => {
			setSelectedKeys(toArray(key as Set<string>).sort(pinyinSort));
		},
		[]
	);

	const handleResetFilters = useCallback(() => {
		vibrate();
		selectConfig.forEach(({selectedKeys, setSelectedKeys}) => {
			if (!checkEmpty(selectedKeys)) {
				setSelectedKeys([]);
			}
		});
	}, [selectConfig, vibrate]);

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
							className={cn(hasFilter ? 'bg-warning-600' : 'bg-primary-600', className)}
							{...props}
						/>
					</PopoverTrigger>
				</span>
			</Tooltip>
			<PopoverContent className="w-64">
				<div className="w-full space-y-1">
					{selectConfig.map(
						({items, label, selectedKeys, selectionMode, setSelectedKeys, spriteTarget}, index) => (
							<Select
								key={index}
								disableAnimation={isReducedMotion}
								isVirtualized={false}
								items={items}
								label={label}
								selectedKeys={selectedKeys}
								selectionMode={selectionMode ?? 'multiple'}
								size="sm"
								onSelectionChange={handleSelectionChange(setSelectedKeys)}
								popoverProps={{
									motionProps: selectMotionProps,
									shouldCloseOnScroll: false,
								}}
								classNames={{
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
								}}
							>
								{({value}) =>
									spriteTarget ? (
										<SelectItem
											key={value}
											textValue={value as string}
											classNames={{
												base: '[&>span]:inline-flex',
											}}
										>
											<span className="inline-flex items-center">
												{spriteTarget === 'customer_normal' ? (
													<div className="h-6 w-6 overflow-hidden rounded-full">
														<Sprite
															target={spriteTarget}
															name={value as never}
															size={2.15}
															className="-translate-x-[0.315rem] -translate-y-px"
														/>
													</div>
												) : spriteTarget === 'customer_rare' ? (
													<Sprite
														target={spriteTarget}
														name={value as never}
														size={1.5}
														className="rounded-full"
													/>
												) : (
													<Sprite target={spriteTarget} name={value as never} size={1} />
												)}
												<span className="ml-1">{value}</span>
											</span>
										</SelectItem>
									) : (
										<SelectItem key={value}>
											{label === 'DLC' && value === 0 ? LABEL_MAP.dlc0 : value.toString()}
										</SelectItem>
									)
								}
							</Select>
						)
					)}
					<Button
						fullWidth
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
