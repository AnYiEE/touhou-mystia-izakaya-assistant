import { type PropsWithChildren } from 'react';

export default function AdminAccessLayout({ children }: PropsWithChildren) {
	return (
		<div className="min-h-main-content min-w-0 space-y-4">{children}</div>
	);
}
