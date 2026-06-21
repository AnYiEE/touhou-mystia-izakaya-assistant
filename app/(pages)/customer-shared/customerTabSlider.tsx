import {
	Children,
	type PropsWithChildren,
	cloneElement,
	isValidElement,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import type { TTab } from '@/(pages)/customer-shared/types';

const tabOrder = ['customer', 'recipe', 'beverage', 'ingredient'] as const;

interface IProps {
	heightKey: number | string;
	selectedTabKey: TTab;
}

export default memo<PropsWithChildren<IProps>>(function CustomerTabSlider({
	children,
	heightKey,
	selectedTabKey,
}) {
	const isReducedMotion = useReducedMotion();
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
		? { duration: 0 }
		: { bounce: 0.15, duration: 0.5, type: 'spring' as const };
	const tabHeightTransition = isReducedMotion
		? { duration: 0 }
		: { duration: 0.3, ease: 'easeInOut' as const };
	const heightTransition = isTabTransitioning
		? tabHeightTransition
		: { duration: 0 };

	useEffect(() => {
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
	}, [isReducedMotion, selectedIndex]);

	const handleAnimationComplete = useCallback(() => {
		setVisibleRange([selectedIndex, selectedIndex]);
		setIsTabTransitioning(false);
	}, [selectedIndex]);

	useLayoutEffect(() => {
		const selectedPanel = panelRefs.current[selectedIndex];
		if (selectedPanel === undefined || selectedPanel === null) {
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
	}, [heightKey, selectedIndex]);

	return (
		<motion.div
			animate={
				selectedPanelHeight === null
					? {}
					: { height: selectedPanelHeight }
			}
			initial={false}
			transition={heightTransition}
			className="overflow-hidden"
		>
			<motion.div
				animate={{ x: `${selectedIndex * -(100 / tabOrder.length)}%` }}
				initial={false}
				onAnimationComplete={handleAnimationComplete}
				transition={tabTransition}
				className="flex will-change-transform"
				style={{ width: `${tabOrder.length * 100}%` }}
			>
				{items.map((child, index) => {
					const tabKey = tabOrder[index];
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
							style={{ flex: `0 0 ${100 / tabOrder.length}%` }}
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
