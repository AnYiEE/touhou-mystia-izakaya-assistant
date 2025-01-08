import {type VariantProps, tv} from 'tailwind-variants';

export const spinner = tv({
	compoundSlots: [
		{
			className: 'h-6 w-6',
			size: 'lg',
			slots: ['base'],
		},
		{
			className: 'h-5 w-5',
			size: 'md',
			slots: ['base'],
		},
		{
			className: 'h-4 w-4',
			size: 'sm',
			slots: ['base'],
		},
	],
	defaultVariants: {
		size: 'md',
	},
	slots: {
		base: 'animate-spin text-current',
		circle: 'opacity-25',
		path: 'opacity-75',
	},
	variants: {
		size: {
			lg: {},
			md: {},
			sm: {},
		},
	},
});

export type TSpinnerVariants = VariantProps<typeof spinner>;
