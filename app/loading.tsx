import {type HTMLAttributes, forwardRef, memo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

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
				className={twMerge('flex h-full w-full select-none flex-col items-center justify-center', className)}
				ref={ref}
			>
				<span
					role="img"
					title={title ?? (content as string)}
					className={twJoin(styles['logo'], 'inline-block animate-bounce')}
				/>
				<p className="text-sm tracking-widest">{content}</p>
			</div>
		);
	})
);
