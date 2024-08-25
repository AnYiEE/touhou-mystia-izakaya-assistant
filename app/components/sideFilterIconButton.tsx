import {type Dispatch, forwardRef, memo, useCallback, useMemo} from 'react';
import {twMerge} from 'tailwind-merge';

import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	type SelectProps,
	type Selection,
} from '@nextui-org/react';
import {faFilter} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Sprite from '@/components/sprite';

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
		const hasFilter = useMemo(() => selectConfig.some(({selectedKeys}) => selectedKeys.length > 0), [selectConfig]);

		const handleSelectionChange = useCallback(
			(setSelectedKeys: ISelectConfigItem['setSelectedKeys']) => (key: Selection) => {
				setSelectedKeys([...(key as Set<string>)].sort(pinyinSort));
			},
			[]
		);

		const handleResetFilters = useCallback(() => {
			selectConfig.forEach(({setSelectedKeys}) => {
				setSelectedKeys([]);
			});
		}, [selectConfig]);

		return (
			<Popover showArrow backdrop="opaque" placement="left" shouldCloseOnInteractOutside={() => true} ref={ref}>
				<PopoverTrigger>
					<FontAwesomeIconButton
						color={hasFilter ? 'warning' : 'primary'}
						icon={faFilter}
						variant="shadow"
						aria-label="筛选"
						className={twMerge('text-white', className)}
						{...props}
					/>
				</PopoverTrigger>
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
											<SelectItem key={value} textValue={value as string}>
												<div className="flex items-center">
													<Sprite target={spriteTarget} name={value as never} size={1} />
													<span className="ml-1">{value}</span>
												</div>
											</SelectItem>
										) : (
											<SelectItem key={value}>{value.toString()}</SelectItem>
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
