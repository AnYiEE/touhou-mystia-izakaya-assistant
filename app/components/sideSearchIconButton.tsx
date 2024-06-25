import {forwardRef, memo, type Dispatch, type SetStateAction} from 'react';

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

export interface ISearchConfig {
	label: AutocompleteProps['label'];
	searchItems: {
		value: string;
	}[];
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<ISearchConfig['searchValue']>>;
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	searchConfig: ISearchConfig;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SideSearchIconButton(
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
						defaultInputValue={searchValue}
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
	})
);
