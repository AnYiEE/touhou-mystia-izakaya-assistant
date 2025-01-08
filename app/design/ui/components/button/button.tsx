import {
	type ComponentRef,
	type HTMLAttributes,
	type ReactNode,
	type RefAttributes,
	forwardRef,
	memo,
	useCallback,
	useMemo,
} from 'react';

import {Button as AriaButton, type ButtonProps, type ButtonRenderProps, type PressEvent} from 'react-aria-components';

import {Ripple, Spinner, useRipple} from '@/design/ui/components';

import {type TButtonVariants, button} from './styles';

interface IProps
	extends RefAttributes<HTMLButtonElement>,
		Omit<ButtonProps, 'className'>,
		Pick<HTMLAttributes<HTMLButtonElement>, 'className'>,
		TButtonVariants {
	blur?: boolean;
	cleanStyle?: boolean;
	disableAnimation?: boolean;
	disableRipple?: boolean;
	iconOnly?: boolean;
	endContent?: ReactNode;
	startContent?: ReactNode;
}

export default memo(
	forwardRef<ComponentRef<'button'>, IProps>(function Button(
		{
			blur = false,
			children,
			className,
			cleanStyle = false,
			color,
			disableAnimation = false,
			disableRipple = false,
			endContent,
			iconOnly = false,
			isDisabled = false,
			isPending = false,
			onPress,
			size,
			startContent,
			variant,
			...props
		},
		ref
	) {
		const {onPress: onRipplePress, ...rippleProps} = useRipple();

		const handlePress = useCallback(
			(event: PressEvent) => {
				if (!disableRipple) {
					onRipplePress(event);
				}
				if (!isPending) {
					onPress?.(event);
				}
			},
			[disableRipple, isPending, onPress, onRipplePress]
		);

		const ariaLabel = props['aria-label'];

		const renderChildren = useCallback(
			(renderProps: ButtonRenderProps) => (
				<>
					{isPending && <Spinner size={size} aria-label={ariaLabel} />}
					{startContent}
					{iconOnly && isPending
						? null
						: typeof children === 'function'
							? children({
									defaultChildren: undefined,
									...renderProps,
								})
							: children}
					{endContent}
					{!disableRipple && <Ripple {...rippleProps} />}
				</>
			),
			[ariaLabel, children, disableRipple, endContent, iconOnly, isPending, rippleProps, size, startContent]
		);

		const styles = useMemo(
			() =>
				button({
					blur,
					className,
					cleanStyle,
					color,
					disableAnimation,
					iconOnly,
					isDisabled,
					isPending,
					size,
					variant,
				}),
			[blur, className, cleanStyle, color, disableAnimation, iconOnly, isDisabled, isPending, size, variant]
		);

		return (
			<AriaButton className={styles} isDisabled={isDisabled} onPress={handlePress} {...props} ref={ref}>
				{renderChildren}
			</AriaButton>
		);
	})
);

export type {IProps as IButtonProps};
