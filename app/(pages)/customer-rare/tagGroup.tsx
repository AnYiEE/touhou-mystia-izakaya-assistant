import {memo, type PropsWithChildren} from 'react';

export default memo(function TagGroup({children}: PropsWithChildren<{}>) {
	return <div className="flex flex-wrap gap-2">{children}</div>;
});
