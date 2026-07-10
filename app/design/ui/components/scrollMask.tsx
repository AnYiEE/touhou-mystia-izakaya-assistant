'use client';

import {
	type PropsWithChildren,
	type UIEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { cn } from '@/design/ui/utils';

import { globalStore as store } from '@/stores';

const EMPTY_SCROLL_STATE = { bottom: false, top: false };
const SCROLL_EDGE_THRESHOLD = 1;

interface IProps {
	className?: string;
	containerClassName?: string;
}

function getScrollState(element: HTMLDivElement) {
	const maxScrollTop = element.scrollHeight - element.clientHeight;
	const canScroll = maxScrollTop > SCROLL_EDGE_THRESHOLD;

	return {
		bottom:
			canScroll &&
			element.scrollTop < maxScrollTop - SCROLL_EDGE_THRESHOLD,
		top: canScroll && element.scrollTop > SCROLL_EDGE_THRESHOLD,
	};
}

export default memo<PropsWithChildren<IProps>>(function ScrollMask({
	children,
	className,
	containerClassName,
}) {
	const [scrollState, setScrollState] = useState(EMPTY_SCROLL_STATE);

	const isHighAppearance = store.persistence.highAppearance.use();

	const scrollRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const updateScrollState = useCallback((element = scrollRef.current) => {
		if (element === null) {
			return;
		}

		const nextScrollState = getScrollState(element);

		setScrollState((currentScrollState) =>
			currentScrollState.bottom === nextScrollState.bottom &&
			currentScrollState.top === nextScrollState.top
				? currentScrollState
				: nextScrollState
		);
	}, []);

	const handleScroll = useCallback(
		(event: UIEvent<HTMLDivElement>) => {
			updateScrollState(event.currentTarget);
		},
		[updateScrollState]
	);

	useEffect(() => {
		const scrollElement = scrollRef.current;
		if (scrollElement === null) {
			return;
		}

		const handleResize = () => {
			updateScrollState(scrollElement);
		};

		handleResize();

		if (typeof ResizeObserver === 'undefined') {
			globalThis.addEventListener('resize', handleResize);

			return () => {
				globalThis.removeEventListener('resize', handleResize);
			};
		}

		// eslint-disable-next-line compat/compat -- Progressive enhancement; scroll state still updates on scroll and window resize without ResizeObserver.
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(scrollElement);

		const contentElement = contentRef.current;
		if (contentElement !== null) {
			resizeObserver.observe(contentElement);
		}

		globalThis.addEventListener('resize', handleResize);

		return () => {
			resizeObserver.disconnect();
			globalThis.removeEventListener('resize', handleResize);
		};
	}, [updateScrollState]);

	const maskBackgroundClassName = isHighAppearance
		? 'from-background/90 via-background/50 dark:from-content1/70 dark:via-content1/45'
		: 'from-background via-background/70 dark:from-content1 dark:via-content1/70';

	return (
		<div
			className={cn(
				'relative min-h-0 overflow-hidden',
				containerClassName
			)}
		>
			<div
				ref={scrollRef}
				data-scroll-mask
				className={cn(
					'overflow-y-auto overflow-x-hidden scrollbar-hide',
					className
				)}
				onScroll={handleScroll}
			>
				<div ref={contentRef}>{children}</div>
			</div>
			<div
				aria-hidden
				className={cn(
					'pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b to-transparent transition-opacity motion-reduce:transition-none',
					maskBackgroundClassName,
					scrollState.top ? 'opacity-100' : 'opacity-0'
				)}
			/>
			<div
				aria-hidden
				className={cn(
					'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t to-transparent transition-opacity motion-reduce:transition-none',
					maskBackgroundClassName,
					scrollState.bottom ? 'opacity-100' : 'opacity-0'
				)}
			/>
		</div>
	);
});

export type { IProps as IScrollMaskProps };
