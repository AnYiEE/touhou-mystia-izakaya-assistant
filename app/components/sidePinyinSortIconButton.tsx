'use client';

import {type Dispatch, type SetStateAction, memo, useCallback} from 'react';
import {twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {faArrowDownAZ, faArrowUpAZ} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Tooltip from '@/components/tooltip';

export enum PinyinSortState {
	NONE = 0,
	AZ = 1,
	ZA = 2,
}

export interface IPinyinSortConfig {
	pinyinSortState: PinyinSortState;
	setPinyinSortState: Dispatch<SetStateAction<PinyinSortState>>;
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	pinyinSortConfig: IPinyinSortConfig;
}

function getNextPinyinSortState(currentState: PinyinSortState): PinyinSortState {
	return (currentState + 1) % 3;
}

export default memo<IProps>(function SidePinyinSortIconButton({
	className,
	pinyinSortConfig: {pinyinSortState, setPinyinSortState},
	...props
}) {
	const vibrate = useVibrate();

	const handlePress = useCallback(() => {
		vibrate();
		setPinyinSortState(getNextPinyinSortState(pinyinSortState));
	}, [pinyinSortState, setPinyinSortState, vibrate]);

	const label = `拼音排序（${
		pinyinSortState === PinyinSortState.NONE
			? '未激活'
			: pinyinSortState === PinyinSortState.AZ
				? '已激活：升序'
				: '已激活：降序'
	}）`;

	return (
		<Tooltip showArrow content={label} placement="left">
			<FontAwesomeIconButton
				color={pinyinSortState === PinyinSortState.NONE ? 'primary' : 'warning'}
				icon={pinyinSortState === PinyinSortState.ZA ? faArrowUpAZ : faArrowDownAZ}
				variant="shadow"
				onPress={handlePress}
				aria-label={label}
				className={twMerge('text-white', className)}
				{...props}
			/>
		</Tooltip>
	);
});
