'use client';

import {
	Modal as HeroUIModal,
	ModalBody,
	ModalContent,
	type ModalProps,
} from '@heroui/modal';
import { type InternalForwardRefRenderFunction } from '@heroui/system';
import { cn } from '@heroui/theme';
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

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import ScrollMask from './scrollMask';
import {
	DEFAULT_SCROLL_STATE,
	type IScrollState,
	getScrollState,
} from './scrollState';

interface IProps extends Omit<ModalProps, 'children'> {
	children: ReactNode | ((onClose: () => void) => ReactNode);
	classNames?: ModalProps['classNames'] & { content?: string };
	scrollMode?: 'mask' | 'shadow';
	scrollShadow?: boolean;
	scrollShadowSize?: number;
}

interface IModalPresentationProps extends IProps {
	isReducedMotion: boolean;
}

interface IModalScrollBodyProps {
	bodyClassName?: NonNullable<ModalProps['classNames']>['body'];
	isHighAppearance: boolean;
	scrollMode: 'mask' | 'none' | 'shadow';
	scrollShadowSize: number;
}

function ModalScrollBody({
	bodyClassName,
	children,
	isHighAppearance,
	scrollMode,
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
		if (scrollMode !== 'shadow') {
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
	}, [scrollMode, updateScrollState]);

	const scrollShadowStyle = {
		height: scrollShadowSize,
	} satisfies CSSProperties;

	const scrollShadowBackgroundClassName = isHighAppearance
		? 'from-background/95 via-background/60 dark:from-background/90 dark:via-background/50'
		: 'from-background via-background/70 dark:from-content1 dark:via-content1/70';

	return (
		<ModalBody className="relative min-h-0 gap-0 overflow-hidden p-0">
			{scrollMode === 'mask' ? (
				<ScrollMask
					className={cn('min-h-0 flex-1 px-6 py-5', bodyClassName)}
					containerClassName="flex min-h-0 flex-1 flex-col"
				>
					{children}
				</ScrollMask>
			) : (
				<div
					ref={scrollElementRef}
					className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide"
					onScroll={
						scrollMode === 'shadow' ? handleScroll : undefined
					}
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
			)}

			{scrollMode === 'shadow' && (
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

export const ModalPresentation = memo<IModalPresentationProps>(
	function ModalPresentation({
		backdrop,
		children,
		classNames,
		disableAnimation,
		isDismissable = true,
		isKeyboardDismissDisabled,
		isOpen = false,
		isReducedMotion,
		onClose,
		onOpenChange,
		portalContainer,
		scrollBehavior = 'inside',
		scrollMode = 'shadow',
		scrollShadow = true,
		scrollShadowSize = 16,
		size = '3xl',
		...props
	}) {
		const { isHighAppearance } = useDesignPreferences();

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
		const keyboardDismissProps =
			isKeyboardDismissDisabled === undefined
				? {}
				: { isKeyboardDismissDisabled };
		const closeProps = onClose === undefined ? {} : { onClose };
		const openChangeProps =
			onOpenChange === undefined ? {} : { onOpenChange };
		const resolvedScrollMode = scrollShadow ? scrollMode : 'none';

		useEffect(() => {
			setDefaultPortalContainer(
				document.querySelector<HTMLElement>('#modal-portal-container')
			);
		}, []);

		return (
			<HeroUIModal
				backdrop={backdrop ?? (isHighAppearance ? 'blur' : 'opaque')}
				disableAnimation={disableAnimation ?? isReducedMotion}
				isDismissable={isDismissable}
				isOpen={isOpen}
				scrollBehavior={scrollBehavior}
				size={size}
				classNames={{
					...modalClassNames,
					backdrop: cn(modalClassNames.backdrop),
					base: cn(
						isHighAppearance
							? 'bg-blend-mystia'
							: 'bg-background dark:bg-content1',
						resolvedScrollMode === 'mask' && 'overflow-hidden',
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
				{...keyboardDismissProps}
				{...closeProps}
				{...openChangeProps}
				{...portalContainerProps}
				{...props}
			>
				<ModalContent
					className={cn(
						props.hideCloseButton ? 'py-0' : 'py-3',
						contentClassName
					)}
				>
					{(onModalClose) => (
						<ModalScrollBody
							bodyClassName={bodyClassName}
							isHighAppearance={isHighAppearance}
							scrollMode={resolvedScrollMode}
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
	}
) as InternalForwardRefRenderFunction<'div', IModalPresentationProps>;

const Modal = memo<IProps>(function Modal(props) {
	const isReducedMotion = useReducedMotion();

	return <ModalPresentation {...props} isReducedMotion={isReducedMotion} />;
}) as InternalForwardRefRenderFunction<'div', IProps>;

export default Modal;

export type { IProps as IModalProps };
