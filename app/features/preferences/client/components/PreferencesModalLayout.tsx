import { type PropsWithChildren } from 'react';

import PreferencesModal from './PreferencesModal';

export default function PreferencesModalLayout({
	children,
}: Readonly<PropsWithChildren>) {
	return (
		<>
			{children}
			<PreferencesModal />
		</>
	);
}
