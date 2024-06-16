import {forwardRef} from 'react';

import {faArrowDownAZ, faArrowUpAZ} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

export enum PinyinSortState {
	NONE = 0,
	AZ = 1,
	ZA = 2,
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant'> {
	pinyinSortState: PinyinSortState;
}

export default forwardRef<HTMLButtonElement | null, IProps>(function SidePinyinSortIconButton(
	{pinyinSortState, ...props},
	ref
) {
	return (
		<FontAwesomeIconButton
			color={pinyinSortState === PinyinSortState.NONE ? 'primary' : 'warning'}
			icon={pinyinSortState === PinyinSortState.ZA ? faArrowUpAZ : faArrowDownAZ}
			variant="shadow"
			aria-label="拼音排序"
			{...props}
			ref={ref}
		/>
	);
});
