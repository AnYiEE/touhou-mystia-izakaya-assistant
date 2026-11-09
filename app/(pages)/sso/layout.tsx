import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default function SsoLayout({ children }: PropsWithChildren) {
	return children;
}
