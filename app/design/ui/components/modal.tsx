'use client';

import {
	type CSSProperties,
	PropsWithChildren,
	type ReactNode,
	type UIEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import {
	Modal as HeroUIModal,
	ModalBody,
	ModalContent,
	type ModalProps,
} from '@heroui/modal';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

import { useReducedMotion } from '@/design/ui/hooks';
import { cn } from '@/design/ui/utils';

import { globalStore as store } from '@/stores';

interface IProps extends Omit<ModalProps, 'children'> {
	children: ReactNode | ((onClose: () => void) => ReactNode);
	classNames?: ModalProps['classNames'] & { content?: string };
	scrollShadow?: boolean;
	scrollShadowSize?: number;
}

interface IModalScrollBodyProps {
	bodyClassName?: NonNullable<ModalProps['classNames']>['body'];
	isHighAppearance: boolean;
	scrollShadow: boolean;
	scrollShadowSize: number;
}

interface IScrollState {
	bottom: boolean;
	top: boolean;
}

const SCROLL_EDGE_THRESHOLD = 1;

const DEFAULT_SCROLL_STATE: IScrollState = { bottom: false, top: false };

function getScrollState(element: HTMLDivElement): IScrollState {
	const maxScrollTop = element.scrollHeight - element.clientHeight;
	const canScroll = maxScrollTop > SCROLL_EDGE_THRESHOLD;

	return {
		bottom:
			canScroll &&
			element.scrollTop < maxScrollTop - SCROLL_EDGE_THRESHOLD,
		top: canScroll && element.scrollTop > SCROLL_EDGE_THRESHOLD,
	};
}

function ModalScrollBody({
	bodyClassName,
	children,
	isHighAppearance,
	scrollShadow,
	scrollShadowSize,
}: PropsWithChildren<IModalScrollBodyProps>) {
	const scrollElementRef = useRef<HTMLDivElement>(null);
	const contentElementRef = useRef<HTMLDivElement>(null);
	const [scrollState, setScrollState] =
		useState<IScrollState>(DEFAULT_SCROLL_STATE);

	const updateScrollState = useCallback(
		(element = scrollElementRef.current) => {
			if (element === null) {
				return;
			}

			const nextScrollState = getScrollState(element);

			setScrollState((currentScrollState) => {
				if (
					currentScrollState.bottom === nextScrollState.bottom &&
					currentScrollState.top === nextScrollState.top
				) {
					return currentScrollState;
				}

				return nextScrollState;
			});
		},
		[]
	);

	const handleScroll = useCallback(
		(event: UIEvent<HTMLDivElement>) => {
			updateScrollState(event.currentTarget);
		},
		[updateScrollState]
	);

	useEffect(() => {
		if (!scrollShadow) {
			setScrollState(DEFAULT_SCROLL_STATE);
			return;
		}

		const scrollElement = scrollElementRef.current;

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

		const contentElement = contentElementRef.current;

		if (contentElement !== null) {
			resizeObserver.observe(contentElement);
		}

		globalThis.addEventListener('resize', handleResize);

		return () => {
			resizeObserver.disconnect();
			globalThis.removeEventListener('resize', handleResize);
		};
	}, [scrollShadow, updateScrollState]);

	const scrollShadowStyle = {
		height: scrollShadowSize,
	} satisfies CSSProperties;

	const scrollShadowBackgroundClassName = isHighAppearance
		? 'from-background/95 via-background/60 dark:from-background/90 dark:via-background/50'
		: 'from-background via-background/70 dark:from-content1 dark:via-content1/70';

	return (
		<ModalBody className="relative min-h-0 gap-0 overflow-hidden p-0">
			<div
				ref={scrollElementRef}
				className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide"
				onScroll={scrollShadow ? handleScroll : undefined}
			>
				<div
					ref={contentElementRef}
					className={cn(
						'flex flex-col gap-3 px-6 py-2',
						bodyClassName
					)}
				>
					{children}
				</div>
			</div>

			{scrollShadow && (
				<>
					<div
						aria-hidden
						className={cn(
							'pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b to-transparent transition-opacity motion-reduce:transition-none',
							scrollShadowBackgroundClassName,
							scrollState.top ? 'opacity-100' : 'opacity-0'
						)}
						style={scrollShadowStyle}
					/>
					<div
						aria-hidden
						className={cn(
							'pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t to-transparent transition-opacity motion-reduce:transition-none',
							scrollShadowBackgroundClassName,
							scrollState.bottom ? 'opacity-100' : 'opacity-0'
						)}
						style={scrollShadowStyle}
					/>
				</>
			)}
		</ModalBody>
	);
}

export default memo<IProps>(function Modal({
	backdrop,
	children,
	classNames,
	disableAnimation,
	portalContainer,
	scrollBehavior = 'inside',
	scrollShadow = true,
	scrollShadowSize = 16,
	size = '3xl',
	...props
}) {
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = store.persistence.highAppearance.use();
	const {
		body: bodyClassName,
		content: contentClassName,
		...modalClassNames
	} = classNames ?? {};

	const [defaultPortalContainer, setDefaultPortalContainer] =
		useState<HTMLElement | null>(null);
	const resolvedPortalContainer =
		portalContainer ?? defaultPortalContainer ?? null;

	const portalContainerProps =
		resolvedPortalContainer === null
			? {}
			: { portalContainer: resolvedPortalContainer };

	useEffect(() => {
		setDefaultPortalContainer(
			document.querySelector<HTMLElement>('#modal-portal-container')
		);
	}, []);

	return (
		<HeroUIModal
			backdrop={backdrop ?? (isHighAppearance ? 'blur' : 'opaque')}
			disableAnimation={disableAnimation ?? isReducedMotion}
			scrollBehavior={scrollBehavior}
			size={size}
			classNames={{
				...modalClassNames,
				base: cn(
					isHighAppearance
						? 'bg-blend-mystia'
						: 'bg-background dark:bg-content1',
					modalClassNames.base
				),
				closeButton: cn(
					'z-20 transition-background motion-reduce:transition-none',
					isHighAppearance
						? 'hover:bg-content1 active:bg-content2'
						: 'dark:hover:bg-default-200 dark:active:bg-default',
					modalClassNames.closeButton
				),
			}}
			{...portalContainerProps}
			{...props}
		>
			<ModalContent className={cn('py-3', contentClassName)}>
				{(onModalClose) => (
					<ModalScrollBody
						bodyClassName={bodyClassName}
						isHighAppearance={isHighAppearance}
						scrollShadow={scrollShadow}
						scrollShadowSize={scrollShadowSize}
					>
						{typeof children === 'function'
							? children(onModalClose)
							: children}
					</ModalScrollBody>
				)}
			</ModalContent>
		</HeroUIModal>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as IModalProps };
