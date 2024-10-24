import {forwardRef, memo} from 'react';

import {type LinkProps, Link as NextUILink} from '@nextui-org/react';

interface IProps extends Omit<LinkProps, 'referrerPolicy'> {}

export default memo(
	forwardRef<HTMLAnchorElement | null, IProps>(function Link(props, ref) {
		return <NextUILink referrerPolicy="same-origin" {...props} ref={ref} />;
	})
);

export type {IProps as ILinkProps};