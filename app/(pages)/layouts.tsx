import { type PropsWithChildren } from 'react';

import PreferencesModal from '@/(pages)/preferences/modal';

export default function Basic({ children }: Readonly<PropsWithChildren>) {
	return children;
}

export function WithPreference({ children }: Readonly<PropsWithChildren>) {
	return (
		<>
			{children}
			<PreferencesModal />
		</>
	);
}
