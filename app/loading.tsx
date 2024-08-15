import {memo} from 'react';

export default memo(function Loading() {
	const content = '少女料理中...';

	return (
		<div className="flex h-full select-none flex-col items-center justify-center">
			<span role="img" title={content} className="inline-block h-loading w-loading bg-loading" />
			<p className="text-sm tracking-widest text-primary dark:text-foreground">{content}</p>
		</div>
	);
});
