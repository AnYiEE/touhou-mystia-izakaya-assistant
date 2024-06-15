import {faArrowDownAZ, faArrowUpAZ} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

export enum PinyinSortState {
	NONE = 0,
	AZ = 1,
	ZA = 2,
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'color' | 'icon'> {
	pinyinSortState: PinyinSortState;
}

export default function SidePinyinSortIconButton({pinyinSortState, ...props}: IProps) {
	return (
		<FontAwesomeIconButton
			color={pinyinSortState === PinyinSortState.NONE ? 'primary' : 'warning'}
			variant="shadow"
			icon={pinyinSortState === PinyinSortState.ZA ? faArrowUpAZ : faArrowDownAZ}
			ariaLabel="拼音排序"
			{...props}
		/>
	);
}
