import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { usePathname } from './usePathname';

type TUpdateParams = (newParams: URLSearchParams) => void;

function concatParams(pathname: string, params: URLSearchParams) {
	return `${pathname}?${params.toString().replaceAll(/=(&|$)/gu, '$1')}`;
}

export function useParams() {
	const router = useRouter();
	const { pathname } = usePathname();
	const searchParams = useSearchParams();

	const params = useMemo(
		() => new URLSearchParams(searchParams),
		[searchParams]
	);

	const push = useCallback<TUpdateParams>(
		(newParams) => {
			router.push(concatParams(pathname, newParams));
		},
		[pathname, router]
	);

	const pushState = useCallback<TUpdateParams>(
		(newParams) => {
			globalThis.history.pushState(
				null,
				'',
				concatParams(pathname, newParams)
			);
		},
		[pathname]
	);

	const replace = useCallback<TUpdateParams>(
		(newParams) => {
			router.replace(concatParams(pathname, newParams));
		},
		[pathname, router]
	);

	const replaceState = useCallback<TUpdateParams>(
		(newParams) => {
			globalThis.history.replaceState(
				null,
				'',
				concatParams(pathname, newParams)
			);
		},
		[pathname]
	);

	return { params, push, pushState, replace, replaceState };
}
