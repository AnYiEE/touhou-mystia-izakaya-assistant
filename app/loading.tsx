export default function Loading() {
	const content = '少女料理中';

	return (
		<div className="flex select-none flex-col items-center justify-center">
			<span aria-hidden title={`${content}...`} className="inline-block h-loading w-loading bg-loading" />
			<p className="font-semibold text-default-300">
				{content}
				<span className="motion-safe:tracking-widest">...</span>
			</p>
		</div>
	);
}
