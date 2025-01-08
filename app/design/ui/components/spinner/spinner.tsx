import {type ComponentRef, HTMLAttributes, RefAttributes, forwardRef, memo, useMemo} from 'react';

import {type TSpinnerVariants, spinner} from './styles';

interface IProps
	extends Pick<HTMLAttributes<SVGSVGElement>, 'aria-label' | 'className'>,
		RefAttributes<SVGSVGElement>,
		TSpinnerVariants {}

export default memo(
	forwardRef<ComponentRef<'svg'>, IProps>(function Spinner({className, size, ...props}, ref) {
		const {base, circle, path} = useMemo(
			() =>
				spinner({
					size,
				}),
			[size]
		);

		return (
			<svg
				className={base({
					className,
				})}
				fill="none"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				{...props}
				ref={ref}
			>
				<circle className={circle()} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
				<path
					className={path()}
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					fill="currentColor"
				/>
			</svg>
		);
	})
);

export type {IProps as ISpinnerProps};
