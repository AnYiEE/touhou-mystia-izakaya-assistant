import {type Dispatch, forwardRef, memo, useCallback, useMemo} from 'react';

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

interface ISelectConfigItem {
	label: SelectProps['label'];
	items: {
		value: number | string;
	}[];
	selectedKeys: string[];
	selectionMode?: SelectProps['selectionMode'];
	setSelectedKeys: Dispatch<ISelectConfigItem['selectedKeys']>;
	spriteTarget?: TSpriteTarget;
}
export type TSelectConfig = ISelectConfigItem[];

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	selectConfig: TSelectConfig;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SideFilterIconButton({selectConfig, ...props}, ref) {
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
						{...props}
					/>
				</PopoverTrigger>
				<PopoverContent className="w-64">
					<div className="flex w-full flex-col gap-1">
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
								color="danger"
								size="sm"
								variant="flat"
								onPress={handleResetFilters}
								className="mt-1"
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
