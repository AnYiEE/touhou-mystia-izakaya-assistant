import {faArrowDownAZ, faArrowUpAZ} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

enum SortState {
	NONE = 0,
	AZ = 1,
	ZA = 2,
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'color' | 'icon'> {
	isPinyinSorted: SortState;
}

function SidePinyinSortIconButton({isPinyinSorted, ...props}: IProps) {
	return (
		<FontAwesomeIconButton
			color={isPinyinSorted === SortState.NONE ? 'primary' : 'warning'}
			variant="shadow"
			icon={isPinyinSorted === SortState.ZA ? faArrowUpAZ : faArrowDownAZ}
			ariaLabel="拼音排序"
			{...props}
		/>
	);
}

export {SortState};
export default SidePinyinSortIconButton;
