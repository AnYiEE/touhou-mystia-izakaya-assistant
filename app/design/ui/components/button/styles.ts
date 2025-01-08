import {type VariantProps, tv} from 'tailwind-variants';
import {cn} from '@/design/ui/utils';

import {CLASSNAME_DATA_FOCUS_VISIBLE} from '@/design/ui/components/constant';

const variantGhostBaseClassName = 'border-2 bg-transparent';
const variantLightBaseClassName = 'bg-transparent';

export const button = tv({
	base: cn(
		'inline-flex appearance-none items-center justify-center',
		'relative overflow-hidden', // For ripple effect.
		'group', // For children.
		CLASSNAME_DATA_FOCUS_VISIBLE
	),
	compoundVariants: [
		{
			blur: true,
			className: 'backdrop-blur',
			cleanStyle: false,
			variant: ['flat', 'ghost', 'shadow', 'solid'],
		},
		{
			blur: true,
			className: 'rac-hover:bg-opacity-80 rac-pressed:bg-opacity-80',
			cleanStyle: false,
			variant: 'ghost',
		},
		{
			blur: true,
			className: 'rac-hover:backdrop-blur rac-pressed:backdrop-blur',
			cleanStyle: false,
			variant: 'light',
		},
		{
			blur: true,
			className: 'bg-opacity-80',
			cleanStyle: false,
			variant: ['shadow', 'solid'],
		},
		{
			className: 'bg-danger/40 text-danger-700 dark:text-danger-600',
			cleanStyle: false,
			color: 'danger',
			variant: 'flat',
		},
		{
			className: 'bg-default/40 text-default-700 dark:text-default-600',
			cleanStyle: false,
			color: 'default',
			variant: 'flat',
		},
		{
			className: 'bg-primary/40 text-primary-700 dark:text-primary',
			cleanStyle: false,
			color: 'primary',
			variant: 'flat',
		},
		{
			className: 'bg-secondary/40 text-secondary-700 dark:text-secondary',
			cleanStyle: false,
			color: 'secondary',
			variant: 'flat',
		},
		{
			className: 'bg-success/40 text-success-700 dark:text-success',
			cleanStyle: false,
			color: 'success',
			variant: 'flat',
		},
		{
			className: 'bg-warning/40 text-warning-700 dark:text-warning-600',
			cleanStyle: false,
			color: 'warning',
			variant: 'flat',
		},
		{
			className: cn(
				variantGhostBaseClassName,
				'border-danger text-danger',
				'rac-hover:bg-danger rac-hover:text-white rac-hover:brightness-100 dark:rac-hover:text-foreground',
				'rac-pressed:bg-danger rac-pressed:text-white rac-pressed:brightness-100 dark:rac-pressed:text-foreground'
			),
			cleanStyle: false,
			color: 'danger',
			variant: 'ghost',
		},
		{
			className: cn(
				variantGhostBaseClassName,
				'border-default text-default-600',
				'rac-hover:bg-default rac-hover:text-default-foreground rac-hover:brightness-100 dark:rac-hover:text-foreground',
				'rac-pressed:bg-default rac-pressed:text-default-foreground rac-pressed:brightness-100 dark:rac-pressed:text-foreground'
			),
			cleanStyle: false,
			color: 'default',
			variant: 'ghost',
		},
		{
			className: cn(
				variantGhostBaseClassName,
				'border-primary text-primary-600 dark:text-primary',
				'rac-hover:bg-primary rac-hover:text-white rac-hover:brightness-100 dark:rac-hover:text-foreground',
				'rac-pressed:bg-primary rac-pressed:text-white rac-pressed:brightness-100 dark:rac-pressed:text-foreground'
			),
			cleanStyle: false,
			color: 'primary',
			variant: 'ghost',
		},
		{
			className: cn(
				variantGhostBaseClassName,
				'border-secondary text-secondary',
				'rac-hover:bg-secondary rac-hover:text-white rac-hover:brightness-100 dark:rac-hover:text-foreground',
				'rac-pressed:bg-secondary rac-pressed:text-white rac-pressed:brightness-100 dark:rac-pressed:text-foreground'
			),
			cleanStyle: false,
			color: 'secondary',
			variant: 'ghost',
		},
		{
			className: cn(
				variantGhostBaseClassName,
				'border-success text-success',
				'rac-hover:bg-success rac-hover:text-white rac-hover:brightness-100 dark:rac-hover:text-foreground',
				'rac-pressed:bg-success rac-pressed:text-white rac-pressed:brightness-100 dark:rac-pressed:text-foreground'
			),
			cleanStyle: false,
			color: 'success',
			variant: 'ghost',
		},
		{
			className: cn(
				variantGhostBaseClassName,
				'border-warning text-warning',
				'rac-hover:bg-warning rac-hover:text-white rac-hover:brightness-100 dark:rac-hover:text-foreground',
				'rac-pressed:bg-warning rac-pressed:text-white rac-pressed:brightness-100 dark:rac-pressed:text-foreground'
			),
			cleanStyle: false,
			color: 'warning',
			variant: 'ghost',
		},
		{
			className: cn(
				variantLightBaseClassName,
				'text-danger',
				'rac-hover:bg-danger/20 rac-hover:text-danger-600 rac-hover:brightness-100 dark:rac-hover:text-danger',
				'rac-pressed:bg-danger/20 rac-pressed:text-danger-600 rac-pressed:brightness-100 dark:rac-pressed:text-danger'
			),
			cleanStyle: false,
			color: 'danger',
			variant: 'light',
		},
		{
			className: cn(
				variantLightBaseClassName,
				'text-default-foreground',
				'rac-hover:bg-default/40 rac-hover:brightness-100',
				'rac-pressed:bg-default/40 rac-pressed:brightness-100'
			),
			cleanStyle: false,
			color: 'default',
			variant: 'light',
		},
		{
			className: cn(
				variantLightBaseClassName,
				'text-primary',
				'rac-hover:bg-primary/40 rac-hover:text-primary-600 rac-hover:brightness-100 dark:rac-hover:bg-primary/20 dark:rac-hover:text-primary',
				'rac-pressed:bg-primary/40 rac-pressed:text-primary-600 rac-pressed:brightness-100 dark:rac-pressed:bg-primary/20 dark:rac-pressed:text-primary'
			),
			cleanStyle: false,
			color: 'primary',
			variant: 'light',
		},
		{
			className: cn(
				variantLightBaseClassName,
				'text-secondary',
				'rac-hover:bg-secondary/20 rac-hover:brightness-100',
				'rac-pressed:bg-secondary/20 rac-pressed:brightness-100'
			),
			cleanStyle: false,
			color: 'secondary',
			variant: 'light',
		},
		{
			className: cn(
				variantLightBaseClassName,
				'text-success',
				'rac-hover:bg-success/20 rac-hover:brightness-100',
				'rac-pressed:bg-success/20 rac-pressed:brightness-100'
			),
			cleanStyle: false,
			color: 'success',
			variant: 'light',
		},
		{
			className: cn(
				variantLightBaseClassName,
				'text-warning',
				'rac-hover:bg-warning/20 rac-hover:brightness-100',
				'rac-pressed:bg-warning/20 rac-pressed:brightness-100'
			),
			cleanStyle: false,
			color: 'warning',
			variant: 'light',
		},
		{
			className: 'bg-danger text-white shadow-lg shadow-danger/40',
			cleanStyle: false,
			color: 'danger',
			variant: 'shadow',
		},
		{
			className: 'bg-default text-default-foreground shadow-lg shadow-default/60',
			cleanStyle: false,
			color: 'default',
			variant: 'shadow',
		},
		{
			className: 'bg-primary text-white shadow-lg shadow-primary/40',
			cleanStyle: false,
			color: 'primary',
			variant: 'shadow',
		},
		{
			className: 'bg-secondary text-white shadow-lg shadow-secondary/40',
			cleanStyle: false,
			color: 'secondary',
			variant: 'shadow',
		},
		{
			className: 'bg-success text-white shadow-lg shadow-success/40',
			cleanStyle: false,
			color: 'success',
			variant: 'shadow',
		},
		{
			className: 'bg-warning text-white shadow-lg shadow-warning/40',
			cleanStyle: false,
			color: 'warning',
			variant: 'shadow',
		},
		{
			className: 'bg-danger text-white',
			cleanStyle: false,
			color: 'danger',
			variant: 'solid',
		},
		{
			className: 'bg-default text-default-foreground',
			cleanStyle: false,
			color: 'default',
			variant: 'solid',
		},
		{
			className: 'bg-primary text-white',
			cleanStyle: false,
			color: 'primary',
			variant: 'solid',
		},
		{
			className: 'bg-secondary text-white',
			cleanStyle: false,
			color: 'secondary',
			variant: 'solid',
		},
		{
			className: 'bg-success text-white',
			cleanStyle: false,
			color: 'success',
			variant: 'solid',
		},
		{
			className: 'bg-warning text-white',
			cleanStyle: false,
			color: 'warning',
			variant: 'solid',
		},
		{
			className: 'gap-3 px-6',
			cleanStyle: false,
			iconOnly: false,
			size: 'lg',
		},
		{
			className: 'gap-2 px-4',
			cleanStyle: false,
			iconOnly: false,
			size: 'md',
		},
		{
			className: 'gap-2 px-3',
			cleanStyle: false,
			iconOnly: false,
			size: 'sm',
		},
		{
			className: 'h-12 min-w-24 rounded-lg text-base',
			cleanStyle: false,
			size: 'lg',
		},
		{
			className: 'h-10 min-w-20 rounded-md text-sm',
			cleanStyle: false,
			size: 'md',
		},
		{
			className: 'h-8 min-w-16 rounded-sm text-xs',
			cleanStyle: false,
			size: 'sm',
		},
		{
			className: 'h-12 w-12 min-w-12',
			cleanStyle: false,
			iconOnly: true,
			size: 'lg',
		},
		{
			className: 'h-10 w-10 min-w-10',
			cleanStyle: false,
			iconOnly: true,
			size: 'md',
		},
		{
			className: 'h-8 w-8 min-w-8',
			cleanStyle: false,
			iconOnly: true,
			size: 'sm',
		},
	],
	defaultVariants: {
		blur: false,
		cleanStyle: false,
		color: 'default',
		disableAnimation: false,
		iconOnly: false,
		isDisabled: false,
		isPending: false,
		size: 'md',
		variant: 'solid',
	},
	variants: {
		blur: {
			false: '',
			true: '',
		},
		cleanStyle: {
			false: 'min-w-max whitespace-nowrap font-normal',
		},
		color: {
			danger: '',
			default: '',
			primary: '',
			secondary: '',
			success: '',
			warning: '',
		},
		disableAnimation: {
			false: 'transition duration-300 rac-hover:brightness-95 rac-pressed:scale-[0.98] rac-pressed:brightness-90',
		},
		iconOnly: {
			false: '',
			true: '',
		},
		isDisabled: {
			true: 'cursor-not-allowed opacity-50',
		},
		isPending: {
			true: 'cursor-progress',
		},
		size: {
			lg: '',
			md: '',
			sm: '',
		},
		variant: {
			flat: '',
			ghost: '',
			light: '',
			shadow: '',
			solid: '',
		},
	},
});

export type TButtonVariants = VariantProps<typeof button>;
