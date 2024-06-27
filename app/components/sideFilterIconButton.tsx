import {forwardRef, memo, useCallback, type Dispatch} from 'react';

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

import {pinyinSort} from '@/utils';

interface ISelectConfigItem {
	label: SelectProps['label'];
	items: {
		value: number | string;
	}[];
	selectedKeys: string[];
	selectionMode?: SelectProps['selectionMode'];
	setSelectedKeys: Dispatch<ISelectConfigItem['selectedKeys']>;
}
export type TSelectConfig = ISelectConfigItem[];

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	selectConfig: TSelectConfig;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SideFilterIconButton({selectConfig, ...props}, ref) {
		const isFiltering = selectConfig.some(({selectedKeys}) => selectedKeys.length > 0);

		const handleSelectionChange = useCallback(
			(setSelectedKeys: ISelectConfigItem['setSelectedKeys']) => (key: Selection) => {
				setSelectedKeys([...(key as Set<string>)].sort(pinyinSort));
			},
			[]
		);

		const handleResetFilters = useCallback(() => {
			selectConfig.forEach(({setSelectedKeys}) => setSelectedKeys([]));
		}, [selectConfig]);

		return (
			<Popover backdrop="opaque" placement="left" showArrow shouldCloseOnInteractOutside={() => true} ref={ref}>
				<PopoverTrigger>
					<FontAwesomeIconButton
						color={isFiltering ? 'warning' : 'primary'}
						icon={faFilter}
						variant="shadow"
						aria-label="筛选"
						{...props}
					/>
				</PopoverTrigger>
				<PopoverContent className="w-64">
					<div className="flex w-full flex-col gap-1">
						{selectConfig.map(({label, items, selectedKeys, selectionMode, setSelectedKeys}, index) => (
							<Select
								key={`${label}${index}`}
								size="sm"
								items={items}
								selectedKeys={selectedKeys}
								selectionMode={selectionMode ?? 'multiple'}
								label={label}
								onSelectionChange={handleSelectionChange(setSelectedKeys)}
							>
								{({value}) => <SelectItem key={value}>{value.toString()}</SelectItem>}
							</Select>
						))}
						{isFiltering && (
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
