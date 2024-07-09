import {forwardRef, memo} from 'react';
import clsx from 'clsx';

import styles from './loading.module.scss';

interface IProps {
	content?: string;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function Loading({content = '少女料理中...'}, ref) {
		return (
			<div className="flex h-full w-full select-none flex-col items-center justify-center" ref={ref}>
				<div className="mb-3 scale-[175%]">
					<span title={content} className={clsx(styles['logo'], 'inline-block animate-bounce')} />
				</div>
				<p className="text-sm tracking-widest">{content}</p>
			</div>
		);
	})
);
