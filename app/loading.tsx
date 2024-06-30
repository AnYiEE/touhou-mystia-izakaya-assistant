import {forwardRef, memo} from 'react';
import clsx from 'clsx';

import styles from './loading.module.scss';

interface IProps {
	content?: string;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function Loading({content = '少女料理中...'}, ref) {
		return (
			<div
				className="flex h-full w-full select-none flex-col items-center justify-center text-sm tracking-widest"
				ref={ref}
			>
				<span className={clsx(styles['logo'], 'h-16 w-16 animate-bounce')} title={content} />
				<p className="mt-1">{content}</p>
			</div>
		);
	})
);
