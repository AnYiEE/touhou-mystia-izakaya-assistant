import {memo} from 'react';
import clsx from 'clsx';

import styles from './loading.module.scss';

export default memo(function Loading() {
	const label = '少女料理中...';

	return (
		<div className="flex h-full w-full select-none flex-col items-center justify-center text-sm tracking-widest">
			<span className={clsx(styles['logo'], 'h-16 w-16 animate-bounce')} title={label} />
			<p className="mt-1">{label}</p>
		</div>
	);
});
