'use client';

import { useEffect } from 'react';

interface IProps {
	from: `/${string}`;
	to: `/${string}`;
}

export function createLegacyRouteRedirectUrl(
	url: Pick<Location, 'hash' | 'pathname' | 'search'>,
	from: `/${string}`,
	to: `/${string}`
) {
	const remainder = url.pathname.startsWith(`${from}/`)
		? url.pathname.slice(from.length)
		: '';

	return `${to}${remainder}${url.search}${url.hash}`;
}

export default function LegacyRouteRedirect({ from, to }: IProps) {
	useEffect(() => {
		location.replace(createLegacyRouteRedirectUrl(location, from, to));
	}, [from, to]);

	return null;
}
