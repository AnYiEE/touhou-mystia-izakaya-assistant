import {type PropsWithChildren, memo} from 'react';

import {cn} from '@/design/ui/components';

interface IProps extends Pick<HTMLUListElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function Ul({children, className}) {
	return <ul className={cn('list-inside list-decimal space-y-2 break-all text-justify', className)}>{children}</ul>;
});
