import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface ILiProps extends Pick<HTMLAttributes<HTMLLIElement>, 'className'> {}

const Li = memo(
	forwardRef<HTMLLIElement | null, PropsWithChildren<ILiProps>>(function Li({className, children}, ref) {
		return (
			<li ref={ref}>
				<span className={twMerge('relative -left-2', className)}>{children}</span>
			</li>
		);
	})
);

interface IOlProps extends Pick<HTMLAttributes<HTMLOListElement>, 'className'> {}

const OlComponent = memo(
	forwardRef<HTMLOListElement | null, PropsWithChildren<IOlProps>>(function Ol({className, children}, ref) {
		return (
			<ol className={twMerge('list-inside list-disc text-justify', className)} ref={ref}>
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
