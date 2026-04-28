import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoHideTooltip(shouldHide: boolean, delay = 3000) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined
	);
	const [isTooltipOpen, setIsTooltipOpen] = useState(false);

	const hideTooltip = useCallback(() => {
		setIsTooltipOpen(false);
		clearTimeout(timerRef.current);
	}, []);

	const showTooltip = useCallback(() => {
		setIsTooltipOpen(true);
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			hideTooltip();
		}, delay);
	}, [delay, hideTooltip]);

	useEffect(
		() => () => {
			clearTimeout(timerRef.current);
		},
		[]
	);

	useEffect(() => {
		if (isTooltipOpen && shouldHide) {
			hideTooltip();
		}
	}, [hideTooltip, isTooltipOpen, shouldHide]);

	return { hideTooltip, isTooltipOpen, showTooltip };
}
