'use client';

import { faArrowDownAZ, faArrowUpAZ } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';

import FontAwesomeIconButton, {
	type IFontAwesomeIconButtonProps,
} from '@/design/ui/components/fontAwesomeIconButton';
import Tooltip from '@/design/ui/components/tooltip';

import {
	type IPinyinSortConfig,
	PINYIN_SORT_STATE_MAP,
	type TPinyinSortState,
} from '@/features/catalog/shared/state/pinyinSort';
import { useVibrate } from '@/features/preferences/client/useVibrate';

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
		pinyinSortState === PINYIN_SORT_STATE_MAP.none
			? '未激活'
			: pinyinSortState === PINYIN_SORT_STATE_MAP.ascending
				? '已激活：升序'
				: '已激活：降序'
	}）`;

	return (
		<Tooltip showArrow content={label} placement="left">
			<FontAwesomeIconButton
				color={
					pinyinSortState === PINYIN_SORT_STATE_MAP.none
						? 'primary'
						: 'warning'
				}
				icon={
					pinyinSortState === PINYIN_SORT_STATE_MAP.descending
						? faArrowUpAZ
						: faArrowDownAZ
				}
				variant="shadow"
				onPress={handlePress}
				aria-label={label}
				className={cn(
					pinyinSortState === PINYIN_SORT_STATE_MAP.none
						? 'bg-primary-600'
						: 'bg-warning-600',
					className
				)}
				{...props}
			/>
		</Tooltip>
	);
});
