import {type ElementRef, type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface ILiProps extends Pick<HTMLAttributes<HTMLLIElement>, 'className'> {}

const Li = memo(
	forwardRef<ElementRef<'li'>, PropsWithChildren<ILiProps>>(function Li({children, className}, ref) {
		return (
			<li ref={ref}>
				<span className={twMerge('relative -left-2', className)}>{children}</span>
			</li>
		);
	})
);

interface IOlProps extends Pick<HTMLAttributes<HTMLOListElement>, 'className'> {}

const OlComponent = memo(
	forwardRef<ElementRef<'ol'>, PropsWithChildren<IOlProps>>(function Ol({children, className}, ref) {
		return (
			<ol className={twMerge('list-inside list-disc break-all text-justify', className)} ref={ref}>
				{children}
			</ol>
		);
	})
);

const Ol = OlComponent as typeof OlComponent & {
	Li: typeof Li;
};

Ol.Li = Li;

export default Ol;
