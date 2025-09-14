import { useCallback } from 'react';

import { usePathname as useNextPathname, useRouter } from 'next/navigation';

import { type TSitePath } from '@/configs';

type TUpdateRoute = (route: TSitePath | (string & {}), path?: string) => void;

function concatPath(route: string, path?: string) {
	return `${route}${path ? `/${path}` : ''}`;
}

export function usePathname() {
	const pathname = useNextPathname() as TSitePath | (string & {});
	const router = useRouter();

	const push = useCallback<TUpdateRoute>(
		(route, path = '') => {
			router.push(concatPath(route, path));
		},
		[router]
	);

	const pushState = useCallback<TUpdateRoute>((route, path = '') => {
		globalThis.history.pushState(null, '', concatPath(route, path));
	}, []);

	const replace = useCallback<TUpdateRoute>(
		(route, path = '') => {
			router.replace(concatPath(route, path));
		},
		[router]
	);

	const replaceState = useCallback<TUpdateRoute>((route, path = '') => {
		globalThis.history.replaceState(null, '', concatPath(route, path));
	}, []);

	return { pathname, push, pushState, replace, replaceState };
}
