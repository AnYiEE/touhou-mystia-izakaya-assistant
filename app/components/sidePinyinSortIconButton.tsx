'use client';

import { type Dispatch, type SetStateAction, memo, useCallback } from 'react';

import { useVibrate } from '@/hooks';

import { faArrowDownAZ, faArrowUpAZ } from '@fortawesome/free-solid-svg-icons';

import { Tooltip, cn } from '@/design/ui/components';

import FontAwesomeIconButton, {
	type IFontAwesomeIconButtonProps,
} from '@/components/fontAwesomeIconButton';

export const pinyinSortStateMap = { az: 1, none: 0, za: 2 } as const;

export type TPinyinSortState = ExtractCollectionValue<
	typeof pinyinSortStateMap
>;

export interface IPinyinSortConfig {
	pinyinSortState: TPinyinSortState;
	setPinyinSortState: Dispatch<SetStateAction<TPinyinSortState>>;
}

interface IProps extends Omit<
	IFontAwesomeIconButtonProps,
	'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'
> {
	pinyinSortConfig: IPinyinSortConfig;
}

function getNextPinyinSortState(currentState: TPinyinSortState) {
	return ((currentState + 1) % 3) as TPinyinSortState;
}

export default memo<IProps>(function SidePinyinSortIconButton({
	className,
	pinyinSortConfig: { pinyinSortState, setPinyinSortState },
	...props
}) {
	const vibrate = useVibrate();

	const handlePress = useCallback(() => {
		vibrate();
		setPinyinSortState(getNextPinyinSortState(pinyinSortState));
	}, [pinyinSortState, setPinyinSortState, vibrate]);

	const label = `拼音排序（${
		pinyinSortState === pinyinSortStateMap.none
			? '未激活'
			: pinyinSortState === pinyinSortStateMap.az
				? '已激活：升序'
				: '已激活：降序'
	}）`;

	return (
		<Tooltip showArrow content={label} placement="left">
			<FontAwesomeIconButton
				color={
					pinyinSortState === pinyinSortStateMap.none
						? 'primary'
						: 'warning'
				}
				icon={
					pinyinSortState === pinyinSortStateMap.za
						? faArrowUpAZ
						: faArrowDownAZ
				}
				variant="shadow"
				onPress={handlePress}
				aria-label={label}
				className={cn(
					pinyinSortState === pinyinSortStateMap.none
						? 'bg-primary-600'
						: 'bg-warning-600',
					className
				)}
				{...props}
			/>
		</Tooltip>
	);
});
