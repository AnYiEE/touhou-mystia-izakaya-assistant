import { useCallback, useMemo } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from '@/hooks';

type TUpdateParams = (newParams: URLSearchParams) => void;

function concatParams(pathname: string, params: URLSearchParams) {
	// eslint-disable-next-line unicorn/prefer-string-replace-all
	return `${pathname}?${params.toString().replace(/=(&|$)/gu, '$1')}`;
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
