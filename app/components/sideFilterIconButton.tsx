import {type Dispatch, forwardRef, memo, useCallback, useMemo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	type SelectProps,
	type Selection,
	Tooltip,
} from '@nextui-org/react';
import {faFilter} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';

import {customerRareStore as customerStore, globalStore} from '@/stores';
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

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SideFilterIconButton({selectConfig, className, ...props}, ref) {
		const vibrate = useVibrate();

		const instance_special = customerStore.instances.customer_special.get();

		const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

		const hasFilter = useMemo(() => selectConfig.some(({selectedKeys}) => selectedKeys.length > 0), [selectConfig]);

		const handleSelectionChange = useCallback(
			(setSelectedKeys: ISelectConfigItem['setSelectedKeys']) => (key: Selection) => {
				setSelectedKeys([...(key as Set<string>)].sort(pinyinSort));
			},
			[]
		);

		const handleResetFilters = useCallback(() => {
			vibrate();
			selectConfig.forEach(({setSelectedKeys}) => {
				setSelectedKeys([]);
			});
		}, [selectConfig, vibrate]);

		const content = `筛选（${hasFilter ? '已' : '未'}激活）`;

		return (
			<Popover
				showArrow
				backdrop={isShowBackgroundImage ? 'blur' : 'opaque'}
				placement="left"
				shouldCloseOnInteractOutside={() => true}
				ref={ref}
			>
				<Tooltip showArrow content={content} placement="left">
					<span className="flex">
						<PopoverTrigger>
							<FontAwesomeIconButton
								color={hasFilter ? 'warning' : 'primary'}
								icon={faFilter}
								variant="shadow"
								aria-label={content}
								className={twMerge('text-white', className)}
								{...props}
							/>
						</PopoverTrigger>
					</span>
				</Tooltip>
				<PopoverContent className="w-64">
					<div className="w-full space-y-1">
						{selectConfig.map(
							({label, items, selectedKeys, selectionMode, setSelectedKeys, spriteTarget}, index) => (
								<Select
									key={`${label as string}${index}`}
									size="sm"
									items={items}
									selectedKeys={selectedKeys}
									selectionMode={selectionMode ?? 'multiple'}
									label={label}
									onSelectionChange={handleSelectionChange(setSelectedKeys)}
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
															target={
																spriteTarget === 'customer_rare' &&
																instance_special.findIndexByName(
																	value as string,
																	true
																) !== -1
																	? 'customer_special'
																	: spriteTarget
															}
															name={value as never}
															size={1.5}
															className={twJoin(
																spriteTarget !== 'customer_normal' && 'rounded-full'
															)}
														/>
													) : (
														<Sprite target={spriteTarget} name={value as never} size={1} />
													)}
													<span className="ml-1">{value}</span>
												</span>
											</SelectItem>
										) : (
											<SelectItem key={value}>
												{label === 'DLC' && value === 0 ? '游戏本体' : value.toString()}
											</SelectItem>
										)
									}
								</Select>
							)
						)}
						{hasFilter && (
							<Button
								fullWidth
								color="danger"
								size="sm"
								variant="flat"
								onPress={handleResetFilters}
								className="!mt-2"
							>
								重置当前筛选
							</Button>
						)}
					</div>
				</PopoverContent>
			</Popover>
		);
	})
);
