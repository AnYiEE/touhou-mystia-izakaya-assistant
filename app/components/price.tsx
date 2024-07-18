import {type PropsWithChildren, memo} from 'react';

interface IProps {}

export default memo(function Price({children}: PropsWithChildren<IProps>) {
	return (
		<>
			<span className="mr-0.5">¥</span>
			{children}
		</>
	);
});
