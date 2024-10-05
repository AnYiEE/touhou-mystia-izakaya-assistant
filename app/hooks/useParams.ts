import {useCallback, useMemo} from 'react';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';

import {type TSitePath} from '@/configs';

export function useParams() {
	const router = useRouter();
	const pathname = usePathname() as TSitePath;
	const searchParams = useSearchParams();

	const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
	const replace = useCallback(
		(newParams: typeof params) => {
			router.replace(`${pathname}?${newParams.toString()}`);
		},
		[pathname, router]
	);

	return [params, replace] as const;
}
