import { usePathname as useNextPathname } from 'next/navigation';

import { type TSitePath } from '@/configs';

export function usePathname() {
	const pathname = useNextPathname() as TSitePath;

	return pathname;
}
