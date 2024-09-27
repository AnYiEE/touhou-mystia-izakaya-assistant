import {type ReactNode} from 'react';

export default function Basic({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}

export function WithPreference({
	children,
	preferences,
}: Readonly<{
	children: ReactNode;
	preferences: ReactNode;
}>) {
	return (
		<>
			{children}
			{preferences}
		</>
	);
}
