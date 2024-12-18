'use client';

import {type Dispatch, memo, useCallback, useMemo} from 'react';

import {useMotionProps, useVibrate} from '@/hooks';

import {
	Button,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	type SelectProps,
	type Selection,
	cn,
} from '@nextui-org/react';
import {faFilter} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {LABEL_DLC_0} from '@/data';
import {globalStore as store} from '@/stores';
import {pinyinSort} from '@/utils';
import type {TSpriteTarget} from '@/utils/sprite/types';

interface ISelectConfigItem extends Pick<SelectProps, 'label' | 'selectionMode'> {
	items: {
		value: number | string;
	}[];
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
	const vibrate = useVibrate();

	const isHighAppearance = store.persistence.highAppearance.use();

	const hasFilter = useMemo(() => selectConfig.some(({selectedKeys}) => selectedKeys.length > 0), [selectConfig]);

	const handleSelectionChange = useCallback(
		(setSelectedKeys: ISelectConfigItem['setSelectedKeys']) => (key: Selection) => {
			setSelectedKeys([...(key as Set<string>)].sort(pinyinSort));
		},
		[]
	);

	const handleResetFilters = useCallback(() => {
		vibrate();
		selectConfig.forEach(({selectedKeys, setSelectedKeys}) => {
			if (selectedKeys.length > 0) {
				setSelectedKeys([]);
			}
		});
	}, [selectConfig, vibrate]);

	const content = `筛选（${hasFilter ? '已' : '未'}激活）`;

	return (
		<Popover
			shouldBlockScroll
			/** @todo Add it back after {@link https://github.com/nextui-org/nextui/issues/3736} is fixed. */
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
							className={cn('text-white', className)}
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
									listboxWrapper: cn('[&_li]:transition-background', {
										'focus:[&_li]:!bg-default-200/40 data-[focus=true]:[&_li]:!bg-default-200/40 data-[hover=true]:[&_li]:!bg-default-200/40':
											isHighAppearance,
									}),
									popoverContent: cn({
										'bg-content1/70 backdrop-blur-lg': isHighAppearance,
									}),
									trigger: cn(
										'transition-background',
										isHighAppearance
											? 'bg-default-100/70 data-[hover=true]:bg-default-200/70'
											: 'data-[hover=true]:bg-default-200'
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
												{spriteTarget.startsWith('customer') ? (
													<Sprite
														target={spriteTarget}
														name={value as never}
														size={1.5}
														className={cn({
															'rounded-full': spriteTarget !== 'customer_normal',
														})}
													/>
												) : (
													<Sprite target={spriteTarget} name={value as never} size={1} />
												)}
												<span className="ml-1">{value}</span>
											</span>
										</SelectItem>
									) : (
										<SelectItem key={value}>
											{label === 'DLC' && value === 0 ? LABEL_DLC_0 : value.toString()}
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
