export default function Loading() {
	const content = '少女料理中';

	return (
		<div className="flex min-h-main-content select-none flex-col items-center justify-center space-y-1 leading-none">
			<span aria-hidden title={`${content}...`} className="block h-loading w-loading bg-loading" />
			<p className="font-semibold text-default-200 dark:text-default-300">
				{content}
				<span className="motion-safe:tracking-widest">...</span>
			</p>
		</div>
	);
}
