'use client';

import {type ElementRef, forwardRef, memo, useMemo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type ButtonProps, Button as HeroUIButton} from '@heroui/button';
import {type InternalForwardRefRenderFunction} from '@heroui/system';

import {cn} from '@/design/ui/utils';

import {globalStore as store} from '@/stores';

interface IProps extends ButtonProps {}

export default memo(
	forwardRef<ElementRef<typeof HeroUIButton>, IProps>(function Button(
		{children, className, color, disableAnimation, endContent, variant, ...props},
		ref
	) {
		const isReducedMotion = useReducedMotion();

		const isHighAppearance = store.persistence.highAppearance.use();

		const styleBase = useMemo(() => {
			const effect = cn(
				'data-[hover=true]:!opacity-100 data-[hover=true]:brightness-95',
				'data-[pressed=true]:scale-[0.98] data-[pressed=true]:brightness-90 motion-reduce:data-[pressed=true]:scale-100'
			);
			const transition = cn('!transition motion-reduce:!transition-none', disableAnimation && '!transition-none');

			switch (variant) {
				case 'light':
					return cn(transition);
				default:
					return cn(effect, transition);
			}
		}, [disableAnimation, variant]);

		const styleBlur = useMemo(() => {
			if (!isHighAppearance) {
				return '';
			}

			switch (variant) {
				case 'bordered':
					return '';
				case 'faded':
					return cn(
						'data-[hover=true]:bg-opacity-80 data-[hover=true]:backdrop-blur',
						'data-[pressed=true]:bg-opacity-80 data-[pressed=true]:backdrop-blur'
					);
				case 'flat':
				case 'ghost':
					return cn('backdrop-blur');
				case 'light':
					return cn('data-[hover=true]:backdrop-blur', 'data-[pressed=true]:backdrop-blur');
				default:
					return cn('bg-opacity-80 backdrop-blur');
			}
		}, [isHighAppearance, variant]);

		const styleColor = useMemo(() => {
			switch (variant) {
				case 'bordered':
					switch (color) {
						case undefined:
						case 'default':
							return cn('text-default-600');
						case 'primary':
							return cn('text-primary-600 dark:text-primary');
						default:
							return '';
					}
				case 'flat':
					switch (color) {
						case 'danger':
							return cn('bg-danger/40 text-danger-700 dark:text-danger-600');
						case 'primary':
							return cn('bg-primary/40 text-primary-700 dark:text-primary');
						case 'secondary':
							return cn('bg-secondary/40 text-secondary-700 dark:text-secondary');
						case 'success':
							return cn('bg-success/40 text-success-700 dark:text-success');
						case 'warning':
							return cn('bg-warning/40 text-warning-700 dark:text-warning-600');
						default:
							return cn('dark:text-default-600');
					}
				case 'ghost':
					switch (color) {
						case 'danger':
							return cn(
								'data-[hover=true]:!text-white data-[hover=true]:brightness-100 dark:data-[hover=true]:!text-foreground',
								'data-[pressed=true]:bg-danger data-[pressed=true]:text-white data-[pressed=true]:brightness-100 dark:data-[pressed=true]:text-foreground'
							);
						case 'primary':
							return cn(
								'text-primary-600 dark:text-primary',
								'data-[hover=true]:!text-white data-[hover=true]:brightness-100 dark:data-[hover=true]:!text-foreground',
								'data-[pressed=true]:bg-primary data-[pressed=true]:text-white data-[pressed=true]:brightness-100 dark:data-[pressed=true]:text-foreground'
							);
						case 'secondary':
							return cn(
								'data-[hover=true]:!text-white data-[hover=true]:brightness-100 dark:data-[hover=true]:!text-foreground',
								'data-[pressed=true]:bg-secondary data-[pressed=true]:text-white data-[pressed=true]:brightness-100 dark:data-[pressed=true]:text-foreground'
							);
						case 'success':
							return cn(
								'data-[hover=true]:!text-white data-[hover=true]:brightness-100 dark:data-[hover=true]:!text-foreground',
								'data-[pressed=true]:bg-success data-[pressed=true]:text-white data-[pressed=true]:brightness-100 dark:data-[pressed=true]:text-foreground'
							);
						case 'warning':
							return cn(
								'data-[hover=true]:!text-white data-[hover=true]:brightness-100 dark:data-[hover=true]:!text-foreground',
								'data-[pressed=true]:bg-warning data-[pressed=true]:text-white data-[pressed=true]:brightness-100 dark:data-[pressed=true]:text-foreground'
							);
						default:
							return cn(
								'text-default-600',
								'data-[hover=true]:text-default-foreground data-[hover=true]:brightness-100 dark:data-[hover=true]:text-foreground',
								'data-[pressed=true]:bg-danger data-[pressed=true]:text-default-foreground data-[pressed=true]:brightness-100 dark:data-[pressed=true]:text-foreground'
							);
					}
				case 'light':
					switch (color) {
						case 'danger':
							return cn(
								'data-[hover=true]:text-danger-600 data-[hover=true]:brightness-100 dark:data-[hover=true]:text-danger',
								'data-[pressed=true]:text-danger-600 data-[pressed=true]:brightness-100 dark:data-[pressed=true]:text-danger'
							);
						case 'primary':
							return cn(
								'data-[hover=true]:!bg-primary/40 data-[hover=true]:text-primary-600 data-[hover=true]:brightness-100 dark:data-[hover=true]:!bg-primary/20 dark:data-[hover=true]:text-primary',
								'data-[pressed=true]:bg-primary/40 data-[pressed=true]:text-primary-600 data-[pressed=true]:brightness-100 dark:data-[pressed=true]:bg-primary/20 dark:data-[pressed=true]:text-primary'
							);
						case 'secondary':
							return cn(
								'data-[hover=true]:brightness-100',
								'data-[pressed=true]:bg-secondary/20 data-[pressed=true]:brightness-100'
							);
						case 'success':
							return cn(
								'data-[hover=true]:brightness-100',
								'data-[pressed=true]:bg-success/20 data-[pressed=true]:brightness-100'
							);
						case 'warning':
							return cn(
								'data-[hover=true]:brightness-100',
								'data-[pressed=true]:bg-warning/20 data-[pressed=true]:brightness-100'
							);
						default:
							return cn(
								'data-[hover=true]:brightness-100',
								'data-[pressed=true]:bg-default/40 data-[pressed=true]:brightness-100'
							);
					}
				case 'shadow':
					switch (color) {
						case 'danger':
						case 'primary':
						case 'secondary':
						case 'success':
						case 'warning':
							return cn('text-white');
						default:
							return cn('shadow-default/60');
					}
				case 'solid':
					switch (color) {
						case 'danger':
						case 'primary':
						case 'secondary':
						case 'success':
						case 'warning':
							return cn('text-white');
						default:
							return '';
					}
				default:
					return '';
			}
		}, [color, variant]);

		return (
			<HeroUIButton
				color={color}
				disableAnimation={disableAnimation ?? isReducedMotion}
				endContent={endContent}
				variant={variant}
				className={cn(styleBase, styleBlur, styleColor, className)}
				{...props}
				ref={ref}
			>
				{typeof children === 'string' && endContent !== undefined ? (
					<span className="leading-none">{children}</span>
				) : (
					children
				)}
			</HeroUIButton>
		);
	})
) as InternalForwardRefRenderFunction<'button', IProps>;

export type {IProps as IButtonProps};
