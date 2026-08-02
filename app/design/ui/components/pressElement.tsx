'use client';

import { cn } from '@heroui/theme';
import {
	type ElementType,
	type FocusEventHandler,
	type HTMLAttributes,
	type KeyboardEventHandler,
	type PointerEventHandler,
	memo,
	useCallback,
	useState,
} from 'react';

import { checkA11yConfirmKey } from '@/shared/utilities/interaction/checkA11yConfirmKey';

type HTMLElementClickEventHandler<T extends HTMLElement> =
	HTMLAttributes<T>['onClick'];
type HTMLElementKeyPressEventHandler<T extends HTMLElement> =
	HTMLAttributes<T>['onKeyDown'];

export type HTMLElementClickEvent<T extends HTMLElement> = Parameters<
	NonNullable<HTMLElementClickEventHandler<T>>
>[0];
export type HTMLElementKeyDownEvent<T extends HTMLElement> = Parameters<
	NonNullable<HTMLElementKeyPressEventHandler<T>>
>[0];

type HTMLElementPressEventHandler<T extends HTMLElement> =
	HTMLElementClickEventHandler<T> & HTMLElementKeyPressEventHandler<T>;

export interface IPressProp<T extends HTMLElement> {
	onPress: HTMLElementPressEventHandler<T>;
}

interface IProps<T extends HTMLElement>
	extends HTMLAttributes<T>, IPressProp<T> {
	as?: ElementType;
}

export default memo(function PressElement<T extends HTMLElement>({
	as: Component = 'span',
	className,
	onBlur,
	onClick,
	onKeyDown,
	onKeyUp,
	onPointerCancel,
	onPointerDown,
	onPointerLeave,
	onPointerUp,
	onPress,
	role,
	...props
}: IProps<T>) {
	const [isPressed, setIsPressed] = useState(false);
	const isInteractive =
		onPress !== undefined || onClick !== undefined || role === 'button';

	const handleBlur = useCallback<FocusEventHandler<T>>(
		(event) => {
			setIsPressed(false);
			onBlur?.(event);
		},
		[onBlur]
	);

	const handleClick = useCallback(
		(event: HTMLElementClickEvent<T>) => {
			setIsPressed(false);
			onClick?.(event);
			onPress?.(event);
		},
		[onClick, onPress]
	);

	const handleKeyDown = useCallback<KeyboardEventHandler<T>>(
		(event) => {
			if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
				setIsPressed(true);
			}
			if (onKeyDown !== undefined) {
				checkA11yConfirmKey(onKeyDown)(event);
			}
			if (onPress !== undefined) {
				checkA11yConfirmKey(onPress)(event);
			}
		},
		[isInteractive, onKeyDown, onPress]
	);

	const handleKeyUp = useCallback<KeyboardEventHandler<T>>(
		(event) => {
			onKeyUp?.(event);
			if (event.key === 'Enter' || event.key === ' ') {
				setIsPressed(false);
			}
		},
		[onKeyUp]
	);

	const handlePointerCancel = useCallback<PointerEventHandler<T>>(
		(event) => {
			setIsPressed(false);
			onPointerCancel?.(event);
		},
		[onPointerCancel]
	);

	const handlePointerDown = useCallback<PointerEventHandler<T>>(
		(event) => {
			if (isInteractive && event.button === 0) {
				setIsPressed(true);
			}
			onPointerDown?.(event);
		},
		[isInteractive, onPointerDown]
	);

	const handlePointerLeave = useCallback<PointerEventHandler<T>>(
		(event) => {
			setIsPressed(false);
			onPointerLeave?.(event);
		},
		[onPointerLeave]
	);

	const handlePointerUp = useCallback<PointerEventHandler<T>>(
		(event) => {
			setIsPressed(false);
			onPointerUp?.(event);
		},
		[onPointerUp]
	);

	return (
		<Component
			{...props}
			role={role}
			data-pressed={isInteractive && isPressed ? true : undefined}
			className={cn(
				isInteractive &&
					'transform-gpu transition data-[pressed=true]:scale-[0.98] data-[pressed=true]:brightness-90 motion-reduce:transition-none motion-reduce:data-[pressed=true]:scale-100',
				className
			)}
			onBlur={handleBlur}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			onPointerCancel={handlePointerCancel}
			onPointerDown={handlePointerDown}
			onPointerLeave={handlePointerLeave}
			onPointerUp={handlePointerUp}
		/>
	);
});
