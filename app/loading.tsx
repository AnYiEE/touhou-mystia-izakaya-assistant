import {type HTMLAttributes, forwardRef, memo} from 'react';
import clsx from 'clsx/lite';

import styles from './loading.module.scss';

interface IProps
	extends Pick<HTMLAttributes<HTMLDivElement>, 'className'>,
		Pick<HTMLAttributes<HTMLSpanElement>, 'title'> {
	content?: ReactNodeWithoutBoolean;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function Loading({className, content = '少女料理中...', title}, ref) {
		return (
			<div
				className={clsx('flex h-full w-full select-none flex-col items-center justify-center', className)}
				ref={ref}
			>
				<div className="mb-3 scale-[175%]">
					<span
						role="img"
						title={title ?? (content as string)}
						className={clsx(styles['logo'], 'inline-block animate-bounce')}
					/>
				</div>
				<p className="text-sm tracking-widest">{content}</p>
			</div>
		);
	})
);
