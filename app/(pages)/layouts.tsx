import { type PropsWithChildren } from 'react';

import PreferencesModal from '@/(pages)/preferences/modal';

export default function Basic({
	children,
}: Readonly<{ children: PropsWithChildren }>) {
	return children;
}

export function WithPreference({
	children,
}: Readonly<{ children: PropsWithChildren }>) {
	return (
		<>
			{children}
			<PreferencesModal />
		</>
	);
}
