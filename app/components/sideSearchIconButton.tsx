import {type Dispatch, type SetStateAction, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {
	Autocomplete,
	AutocompleteItem,
	type AutocompleteProps,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
} from '@nextui-org/react';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

import {globalStore as store} from '@/stores';

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
		{searchConfig: {label, searchItems, searchValue, setSearchValue}, className, ...props},
		ref
	) {
		const isShowBackgroundImage = store.persistence.backgroundImage.use();

		const content = `搜索（${searchValue ? '已' : '未'}激活）`;

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
								color={searchValue ? 'warning' : 'primary'}
								icon={faMagnifyingGlass}
								variant="shadow"
								aria-label={content}
								className={twMerge('text-white', className)}
								{...props}
							/>
						</PopoverTrigger>
					</span>
				</Tooltip>
				<PopoverContent className="w-64">
					<Autocomplete
						allowsCustomValue
						variant="flat"
						defaultInputValue={searchValue}
						defaultItems={searchItems}
						label={label}
						onInputChange={setSearchValue}
					>
						{({value}) => <AutocompleteItem key={value}>{value}</AutocompleteItem>}
					</Autocomplete>
				</PopoverContent>
			</Popover>
		);
	})
);
