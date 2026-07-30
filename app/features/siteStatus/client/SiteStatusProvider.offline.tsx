'use client';

import { type PropsWithChildren } from 'react';

export function useSiteMaintenance() {
	return null;
}

export function useSiteVisitors() {
	return { hasLoaded: false, visitors: null };
}

export default function SiteStatusProvider({ children }: PropsWithChildren) {
	return children;
}
