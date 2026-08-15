import { cn } from '@heroui/theme';
import { motion } from 'framer-motion';
import isNil from 'lodash/isNil.js';
import {
	Children,
	type PropsWithChildren,
	cloneElement,
	isValidElement,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { TTab } from '@/features/catalog/guests/shared/contracts';

import { checkCompatibility } from '@/infrastructure/browser/compatibility/checkCompatibility';

const tabOrder = ['guest', 'food', 'beverage', 'ingredient'] as const;
const REDUCED_MOTION_TRANSITION = { duration: 0 } as const;
const TAB_TRANSITION = { bounce: 0.15, duration: 0.5, type: 'spring' } as const;
const TAB_HEIGHT_TRANSITION = { duration: 0.3, ease: 'easeInOut' } as const;
const EMPTY_ANIMATION = {} as const;
const TAB_SLIDER_STYLE = { width: `${tabOrder.length * 100}%` } as const;
const TAB_PANEL_STYLE = { flex: `0 0 ${100 / tabOrder.length}%` } as const;

interface IProps {
	heightKey: number | string;
	selectedTabKey: TTab;
}

export default memo<PropsWithChildren<IProps>>(function GuestTabSlider({
	children,
	heightKey,
	selectedTabKey,
}) {
	const isReducedMotion = useReducedMotion();
	const isLargeSlidingPanelAnimationSupported =
		checkCompatibility().largeSlidingPanelAnimation;
	const selectedIndex = tabOrder.indexOf(selectedTabKey);
	const previousSelectedIndexRef = useRef(selectedIndex);
	const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
	const [visibleRange, setVisibleRange] = useState<[number, number]>([
		selectedIndex,
		selectedIndex,
	]);
	const [selectedPanelHeight, setSelectedPanelHeight] = useState<
		number | null
	>(null);
	const [isTabTransitioning, setIsTabTransitioning] = useState(false);

	const items = Children.toArray(children);
	const tabTransition = isReducedMotion
		? REDUCED_MOTION_TRANSITION
		: TAB_TRANSITION;
	const tabHeightTransition = isReducedMotion
		? REDUCED_MOTION_TRANSITION
		: TAB_HEIGHT_TRANSITION;
	const heightTransition = isTabTransitioning
		? tabHeightTransition
		: REDUCED_MOTION_TRANSITION;
	const heightAnimation = useMemo(
		() =>
			selectedPanelHeight === null
				? EMPTY_ANIMATION
				: { height: selectedPanelHeight },
		[selectedPanelHeight]
	);
	const tabAnimation = useMemo(
		() => ({ x: `${selectedIndex * -(100 / tabOrder.length)}%` }),
		[selectedIndex]
	);

	useEffect(() => {
		if (!isLargeSlidingPanelAnimationSupported) {
			previousSelectedIndexRef.current = selectedIndex;
			setVisibleRange([selectedIndex, selectedIndex]);
			setIsTabTransitioning(false);
			return;
		}

		const previousSelectedIndex = previousSelectedIndexRef.current;

		if (previousSelectedIndex === selectedIndex) {
			setVisibleRange([selectedIndex, selectedIndex]);
			setIsTabTransitioning(false);
			return;
		}

		setVisibleRange([
			Math.min(previousSelectedIndex, selectedIndex),
			Math.max(previousSelectedIndex, selectedIndex),
		]);
		previousSelectedIndexRef.current = selectedIndex;
		setIsTabTransitioning(!isReducedMotion);
	}, [isLargeSlidingPanelAnimationSupported, isReducedMotion, selectedIndex]);

	const handleAnimationComplete = useCallback(() => {
		setVisibleRange([selectedIndex, selectedIndex]);
		setIsTabTransitioning(false);
	}, [selectedIndex]);

	useLayoutEffect(() => {
		if (!isLargeSlidingPanelAnimationSupported) {
			return;
		}

		const selectedPanel = panelRefs.current[selectedIndex];
		if (isNil(selectedPanel)) {
			setSelectedPanelHeight(null);
			return;
		}
		const selectedPanelContent = selectedPanel.firstElementChild;
		const measuredElement =
			selectedPanelContent instanceof HTMLElement
				? selectedPanelContent
				: selectedPanel;

		const updateSelectedPanelHeight = () => {
			const nextHeight = measuredElement.getBoundingClientRect().height;
			setSelectedPanelHeight((currentHeight) =>
				currentHeight !== null &&
				Math.abs(currentHeight - nextHeight) < 0.5
					? currentHeight
					: nextHeight
			);
		};

		updateSelectedPanelHeight();

		const resizeObserver =
			typeof ResizeObserver === 'undefined'
				? null
				: // eslint-disable-next-line compat/compat -- Progressive enhancement; resize still works without ResizeObserver.
					new ResizeObserver(updateSelectedPanelHeight);
		resizeObserver?.observe(measuredElement);

		if (resizeObserver === null) {
			globalThis.addEventListener('resize', updateSelectedPanelHeight);
		}

		return () => {
			resizeObserver?.disconnect();
			if (resizeObserver === null) {
				globalThis.removeEventListener(
					'resize',
					updateSelectedPanelHeight
				);
			}
		};
	}, [heightKey, isLargeSlidingPanelAnimationSupported, selectedIndex]);

	if (!isLargeSlidingPanelAnimationSupported) {
		return (
			<div className="overflow-hidden">
				{items.map((child, index) => {
					const tabKey = tabOrder[index] ?? `overflow:${index}`;
					const isSelected = tabKey === selectedTabKey;

					return (
						<div
							key={tabKey}
							aria-hidden={!isSelected}
							inert={isSelected ? undefined : true}
							className={cn(
								'min-h-0 min-w-0 overflow-hidden',
								isSelected ? 'h-auto' : 'hidden h-0'
							)}
						>
							{child}
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<motion.div
			animate={heightAnimation}
			initial={false}
			transition={heightTransition}
			className="overflow-hidden"
		>
			<motion.div
				animate={tabAnimation}
				initial={false}
				onAnimationComplete={handleAnimationComplete}
				transition={tabTransition}
				className="flex will-change-transform"
				style={TAB_SLIDER_STYLE}
			>
				{items.map((child, index) => {
					const tabKey = tabOrder[index] ?? `overflow:${index}`;
					const isSelected = tabKey === selectedTabKey;
					const isVisible = isReducedMotion
						? isSelected
						: isSelected ||
							(index >= visibleRange[0] &&
								index <= visibleRange[1]);
					return (
						<div
							key={tabKey}
							ref={(element) => {
								panelRefs.current[index] = element;
							}}
							aria-hidden={!isSelected}
							inert={isSelected ? undefined : true}
							className={cn(
								'min-h-0 min-w-0 shrink-0 overflow-hidden',
								isVisible ? 'h-auto' : 'h-0'
							)}
							style={TAB_PANEL_STYLE}
						>
							{isValidElement<{ className?: string }>(child)
								? cloneElement(child, {
										className: cn(
											child.props.className,
											!isVisible && 'hidden'
										),
									})
								: child}
						</div>
					);
				})}
			</motion.div>
		</motion.div>
	);
});
