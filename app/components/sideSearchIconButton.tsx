import {forwardRef, type Dispatch, type SetStateAction} from 'react';

import {
	Autocomplete,
	AutocompleteItem,
	Popover,
	PopoverContent,
	PopoverTrigger,
	type AutocompleteProps,
} from '@nextui-org/react';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

export type SearchConfig = {
	label: AutocompleteProps['label'];
	searchItems: {
		value: string;
	}[];
	searchValue: string | null;
	setSearchValue: Dispatch<SetStateAction<SearchConfig['searchValue']>>;
};

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	searchConfig: SearchConfig;
}

export default forwardRef<HTMLDivElement | null, IProps>(function SideSearchIconButton(
	{searchConfig: {label, searchItems, searchValue, setSearchValue}, ...props},
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
					label={label}
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
