import {useCallback, useMemo} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';

export function useParams() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
	const replace = useCallback(
		(newParams: typeof params) => router.replace(`${pathname}?${newParams.toString()}`),
		[pathname, router]
	);

	return [params, replace] as const;
}
