import {
	Children,
	type PropsWithChildren,
	cloneElement,
	isValidElement,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import type { TTab } from '@/(pages)/customer-shared/types';

const tabOrder = ['customer', 'recipe', 'beverage', 'ingredient'] as const;

interface IProps {
	selectedTabKey: TTab;
}

export default memo<PropsWithChildren<IProps>>(function CustomerTabSlider({
	children,
	selectedTabKey,
}) {
	const isReducedMotion = useReducedMotion();
	const selectedIndex = tabOrder.indexOf(selectedTabKey);
	const previousSelectedIndexRef = useRef(selectedIndex);
	const [visibleRange, setVisibleRange] = useState<[number, number]>([
		selectedIndex,
		selectedIndex,
	]);
	const items = Children.toArray(children);

	useEffect(() => {
		const previousSelectedIndex = previousSelectedIndexRef.current;

		if (previousSelectedIndex === selectedIndex) {
			setVisibleRange([selectedIndex, selectedIndex]);
			return;
		}

		setVisibleRange([
			Math.min(previousSelectedIndex, selectedIndex),
			Math.max(previousSelectedIndex, selectedIndex),
		]);
		previousSelectedIndexRef.current = selectedIndex;
	}, [selectedIndex]);

	const handleAnimationComplete = useCallback(() => {
		setVisibleRange([selectedIndex, selectedIndex]);
	}, [selectedIndex]);

	return (
		<div className="overflow-hidden">
			<motion.div
				animate={{ x: `${selectedIndex * -(100 / tabOrder.length)}%` }}
				initial={false}
				onAnimationComplete={handleAnimationComplete}
				transition={
					isReducedMotion
						? { duration: 0 }
						: { bounce: 0.15, duration: 0.5, type: 'spring' }
				}
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
		</div>
	);
});
