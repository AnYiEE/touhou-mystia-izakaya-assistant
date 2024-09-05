import {type Dispatch, type SetStateAction, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Tooltip} from '@nextui-org/react';
import {faArrowDownAZ, faArrowUpAZ} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';

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

function getNextPinyinSortState(currentState: PinyinSortState) {
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
}

export default memo(
	forwardRef<HTMLButtonElement | null, IProps>(function SidePinyinSortIconButton(
		{pinyinSortConfig: {pinyinSortState, setPinyinSortState}, className, ...props},
		ref
	) {
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
					onPress={() => {
						setPinyinSortState(getNextPinyinSortState(pinyinSortState));
					}}
					aria-label={label}
					className={twMerge('text-white', className)}
					{...props}
					ref={ref}
				/>
			</Tooltip>
		);
	})
);
