import {forwardRef, type Dispatch, type SetStateAction} from 'react';

import {Autocomplete, AutocompleteItem, Popover, PopoverContent, PopoverTrigger} from '@nextui-org/react';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	searchItems: {
		value: string;
	}[];
	searchValue: string | null;
	setSearchValue: Dispatch<SetStateAction<IProps['searchValue']>>;
}

export default forwardRef<HTMLDivElement | null, IProps>(function SideSearchIconButton(
	{searchItems, searchValue, setSearchValue, ...props},
	ref
) {
	return (
		<Popover backdrop="opaque" placement="left" showArrow shouldCloseOnInteractOutside={() => true} ref={ref}>
			<PopoverTrigger>
				<FontAwesomeIconButton
					color={searchValue ? 'warning' : 'primary'}
					icon={faMagnifyingGlass}
					variant="shadow"
					aria-label="搜索"
					{...props}
				/>
			</PopoverTrigger>
			<PopoverContent className="w-64">
				<Autocomplete
					allowsCustomValue
					variant="faded"
					defaultItems={searchItems}
					label="请输入您想要搜索的名称"
					onInputChange={setSearchValue}
					onSelectionChange={(key) => {
						setSearchValue(key as string);
					}}
				>
					{({value}) => <AutocompleteItem key={value}>{value}</AutocompleteItem>}
				</Autocomplete>
			</PopoverContent>
		</Popover>
	);
});
