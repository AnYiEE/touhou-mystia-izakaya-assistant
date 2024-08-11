import {type PropsWithChildren, memo} from 'react';

interface IProps {}

export default memo<PropsWithChildren<IProps>>(function Price({children}) {
	return (
		<>
			<span className="mr-0.5">¥</span>
			{children}
		</>
	);
});
