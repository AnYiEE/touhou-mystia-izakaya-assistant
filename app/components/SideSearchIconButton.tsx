import {forwardRef, type Dispatch, type SetStateAction} from 'react';

import {Input, Popover, PopoverContent, PopoverTrigger} from '@nextui-org/react';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<string>>;
}

export default forwardRef<HTMLDivElement | null, IProps>(function SideSearchIconButton(
	{searchValue, setSearchValue, ...props},
	ref
) {
	return (
		<Popover backdrop="opaque" placement="left" showArrow ref={ref}>
			<PopoverTrigger>
				<FontAwesomeIconButton
					color={searchValue.length ? 'warning' : 'primary'}
					icon={faMagnifyingGlass}
					variant="shadow"
					aria-label="搜索"
					{...props}
				/>
			</PopoverTrigger>
			<PopoverContent>
				<Input
					isClearable
					variant="faded"
					label="请输入您想要搜索的名称"
					value={searchValue}
					onValueChange={setSearchValue}
				/>
			</PopoverContent>
		</Popover>
	);
});
