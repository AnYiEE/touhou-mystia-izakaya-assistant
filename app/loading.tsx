export default function Loading() {
	const content = '少女料理中';

	return (
		<div className="flex min-h-main-content select-none flex-col items-center justify-center space-y-1 leading-none">
			<span aria-hidden title={`${content}...`} className="block h-loading w-loading bg-loading" />
			<p className="font-semibold text-default-400 dark:text-default">
				{content}
				<span className="tracking-widest">...</span>
			</p>
		</div>
	);
}
