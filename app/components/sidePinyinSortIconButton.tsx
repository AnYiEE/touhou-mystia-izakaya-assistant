import {forwardRef, type Dispatch, type SetStateAction} from 'react';

import {faArrowDownAZ, faArrowUpAZ} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

export enum PinyinSortState {
	NONE = 0,
	AZ = 1,
	ZA = 2,
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	pinyinSortState: PinyinSortState;
	setPinyinSortState: Dispatch<SetStateAction<PinyinSortState>>;
}

const getNextPinyinSortState = (currentState: PinyinSortState): PinyinSortState => {
	switch (currentState) {
		case PinyinSortState.NONE:
			return PinyinSortState.AZ;
		case PinyinSortState.AZ:
			return PinyinSortState.ZA;
		case PinyinSortState.ZA:
			return PinyinSortState.NONE;
		default:
			return PinyinSortState.NONE;
	}
};

export default forwardRef<HTMLButtonElement | null, IProps>(function SidePinyinSortIconButton(
	{pinyinSortState, setPinyinSortState, ...props},
	ref
) {
	return (
		<FontAwesomeIconButton
			color={pinyinSortState === PinyinSortState.NONE ? 'primary' : 'warning'}
			icon={pinyinSortState === PinyinSortState.ZA ? faArrowUpAZ : faArrowDownAZ}
			variant="shadow"
			onPress={() => setPinyinSortState(getNextPinyinSortState(pinyinSortState))}
			aria-label="拼音排序"
			{...props}
			ref={ref}
		/>
	);
});
