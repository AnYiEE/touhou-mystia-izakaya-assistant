import { animate } from 'framer-motion';
import { useCallback, useLayoutEffect, useRef } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

interface IPendingAnimation {
	fromRect: DOMRect;
	targetIndex: number;
}

interface IRemoveAnimationOptions {
	collapseLayout?: boolean;
	dividerDataIndex?: number | undefined;
	nextRowDataIndex?: number | undefined;
}

function prepareCollapseAnimation(element: HTMLElement) {
	const { height } = element.getBoundingClientRect();
	const { marginBottom, marginTop } = getComputedStyle(element);

	element.style.height = `${height}px`;
	element.style.overflow = 'hidden';

	return { height, marginBottom, marginTop };
}

export function useSavedMealReorderAnimation() {
	const isReducedMotion = useReducedMotion();

	const pendingAnimationsRef = useRef<IPendingAnimation[]>([]);
	const contentElementsRef = useRef(new Map<number, HTMLDivElement>());
	const rowElementsRef = useRef(new Map<number, HTMLDivElement>());

	const registerSavedMealContent = useCallback(
		(dataIndex: number) => (element: HTMLDivElement | null) => {
			if (element === null) {
				contentElementsRef.current.delete(dataIndex);
				return;
			}

			contentElementsRef.current.set(dataIndex, element);
		},
		[]
	);

	const registerSavedMealRow = useCallback(
		(dataIndex: number) => (element: HTMLDivElement | null) => {
			if (element === null) {
				rowElementsRef.current.delete(dataIndex);
				return;
			}

			rowElementsRef.current.set(dataIndex, element);
		},
		[]
	);

	const animateSavedMealSwap = useCallback(
		(currentDataIndex: number, nextDataIndex: number) => {
			if (isReducedMotion) {
				return;
			}

			const currentElement =
				contentElementsRef.current.get(currentDataIndex);
			const nextElement = contentElementsRef.current.get(nextDataIndex);

			if (currentElement === undefined || nextElement === undefined) {
				return;
			}

			pendingAnimationsRef.current = [
				{
					fromRect: nextElement.getBoundingClientRect(),
					targetIndex: currentDataIndex,
				},
				{
					fromRect: currentElement.getBoundingClientRect(),
					targetIndex: nextDataIndex,
				},
			];
		},
		[isReducedMotion]
	);

	const animateSavedMealRemove = useCallback(
		async (
			dataIndex: number,
			{
				collapseLayout = true,
				dividerDataIndex,
				nextRowDataIndex,
			}: IRemoveAnimationOptions = {}
		) => {
			if (isReducedMotion) {
				return;
			}

			const rowElement = rowElementsRef.current.get(dataIndex);
			if (rowElement === undefined) {
				return;
			}

			if (!collapseLayout) {
				await animate(
					rowElement,
					{ opacity: [1, 0], scale: [1, 0.99], y: [0, -4] },
					{ duration: MOTION_DURATION_S.fast, ease: MOTION_EASE.exit }
				);
				return;
			}

			const rowMetrics = prepareCollapseAnimation(rowElement);
			rowElement.style.transformOrigin = 'center top';

			const rowAnimation = animate(
				rowElement,
				{
					height: [rowMetrics.height, 0],
					marginBottom: [rowMetrics.marginBottom, '0px'],
					marginTop: [rowMetrics.marginTop, '0px'],
					opacity: [1, 0],
					scale: [1, 0.99],
					y: [0, -4],
				},
				{ duration: MOTION_DURATION_S.base, ease: MOTION_EASE.standard }
			);

			const dividerRowElement =
				dividerDataIndex === undefined
					? undefined
					: rowElementsRef.current.get(dividerDataIndex);
			const dividerElement =
				dividerRowElement?.nextElementSibling instanceof HTMLElement
					? dividerRowElement.nextElementSibling
					: undefined;
			const dividerAnimation = (() => {
				if (dividerElement === undefined) {
					return null;
				}

				const dividerMetrics = prepareCollapseAnimation(dividerElement);
				return animate(
					dividerElement,
					{
						height: [dividerMetrics.height, 0],
						marginBottom: [dividerMetrics.marginBottom, '0px'],
						marginTop: [dividerMetrics.marginTop, '0px'],
						opacity: [1, 0],
					},
					{
						duration: MOTION_DURATION_S.base,
						ease: MOTION_EASE.standard,
					}
				);
			})();

			const nextRowElement =
				nextRowDataIndex === undefined
					? undefined
					: rowElementsRef.current.get(nextRowDataIndex);
			const nextRowMarginAnimation = (() => {
				if (nextRowElement === undefined) {
					return null;
				}

				const { marginTop } = getComputedStyle(nextRowElement);
				if (marginTop === '0px') {
					return null;
				}

				return animate(
					nextRowElement,
					{ marginTop: [marginTop, '0px'] },
					{
						duration: MOTION_DURATION_S.base,
						ease: MOTION_EASE.standard,
					}
				);
			})();

			await rowAnimation;
			if (dividerAnimation !== null) {
				await dividerAnimation;
			}
			if (nextRowMarginAnimation !== null) {
				await nextRowMarginAnimation;
			}
			if (nextRowElement !== undefined) {
				requestAnimationFrame(() => {
					nextRowElement.style.marginTop = '';
				});
			}
		},
		[isReducedMotion]
	);

	useLayoutEffect(() => {
		if (isReducedMotion) {
			pendingAnimationsRef.current = [];
			return;
		}

		const pendingAnimations = pendingAnimationsRef.current;
		if (pendingAnimations.length === 0) {
			return;
		}

		pendingAnimationsRef.current = [];

		for (const { fromRect, targetIndex } of pendingAnimations) {
			const element = contentElementsRef.current.get(targetIndex);
			if (element === undefined) {
				continue;
			}

			const targetRect = element.getBoundingClientRect();
			const translateY = fromRect.top - targetRect.top;
			if (translateY === 0) {
				continue;
			}

			animate(
				element,
				{ y: [translateY, 0] },
				{ duration: MOTION_DURATION_S.base, ease: MOTION_EASE.standard }
			);
		}
	});

	return {
		animateSavedMealRemove,
		animateSavedMealSwap,
		registerSavedMealContent,
		registerSavedMealRow,
	};
}
