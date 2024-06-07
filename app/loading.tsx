import {Image} from '@nextui-org/react';

export default function Loading() {
	return (
		<div className="flex h-full w-full select-none flex-col items-center justify-center text-sm tracking-widest">
			<Image alt="Logo" src="/favicon.png" className="w-16 animate-bounce" draggable={false} />
			<p className="mt-1">少女料理中...</p>
		</div>
	);
}
