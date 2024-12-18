import {type PropsWithChildren, memo} from 'react';

import {cn} from '@nextui-org/react';

interface ILiProps extends Pick<HTMLLIElementAttributes, 'className'> {}

const Li = memo<PropsWithChildren<ILiProps>>(function Li({children, className}) {
	return (
		<li>
			<span className={cn('relative -left-2', className)}>{children}</span>
		</li>
	);
});

interface IOlProps extends Pick<HTMLOListElementAttributes, 'className'> {}

const OlComponent = memo<PropsWithChildren<IOlProps>>(function Ol({children, className}) {
	return <ol className={cn('list-inside list-disc break-all text-justify', className)}>{children}</ol>;
});

const Ol = OlComponent as typeof OlComponent & {
	Li: typeof Li;
};

Ol.Li = Li;

export default Ol;
