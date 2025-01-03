'use client';

import {type ElementType, type ForwardedRef, type HTMLAttributes, forwardRef, memo, useCallback} from 'react';

import {checkA11yConfirmKey} from '@/utils';

type HTMLElementClickEventHandler<T extends HTMLElement> = HTMLAttributes<T>['onClick'];
type HTMLElementKeyPressEventHandler<T extends HTMLElement> = HTMLAttributes<T>['onKeyDown'];

export type HTMLElementClickEvent<T extends HTMLElement> = Parameters<NonNullable<HTMLElementClickEventHandler<T>>>[0];
export type HTMLElementKeyDownEvent<T extends HTMLElement> = Parameters<
	NonNullable<HTMLElementKeyPressEventHandler<T>>
>[0];

type HTMLElementPressEventHandler<T extends HTMLElement> = HTMLElementClickEventHandler<T> &
	HTMLElementKeyPressEventHandler<T>;
type HTMLElementPressEvent<T extends HTMLElement> = HTMLElementClickEvent<T> & HTMLElementKeyDownEvent<T>;

export interface IPressProp<T extends HTMLElement> {
	onPress: HTMLElementPressEventHandler<T>;
}

interface IProps<T extends HTMLElement> extends HTMLAttributes<T>, IPressProp<T> {
	as: ElementType;
}

export default memo(
	forwardRef(function PressElement<T extends HTMLElement>(
		{as: Component = 'span', onClick, onKeyDown, onPress, ...props}: IProps<T>,
		ref: ForwardedRef<T>
	) {
		const handleClick = useCallback(
			(event: HTMLElementPressEvent<T>) => {
				onClick?.(event);
				onPress?.(event);
			},
			[onClick, onPress]
		);

		const handleKeyDown = useCallback(
			(event: HTMLElementPressEvent<T>) => {
				if (onKeyDown !== undefined) {
					checkA11yConfirmKey(onKeyDown)(event);
				}
				if (onPress !== undefined) {
					checkA11yConfirmKey(onPress)(event);
				}
			},
			[onKeyDown, onPress]
		);

		return <Component onClick={handleClick} onKeyDown={handleKeyDown} {...props} ref={ref} />;
	})
);
