import {useEffect, useState} from 'react';
import {useSearchParams} from 'next/navigation';

export function useOpenedFoodPopover(openedPopoverParam: string) {
	const searchParams = useSearchParams();

	const [openedPopover, setOpenedPopover] = useState<string | null>(null);

	useEffect(() => {
		setOpenedPopover(searchParams.get(openedPopoverParam));
	}, [openedPopoverParam, searchParams]);

	return [openedPopover, setOpenedPopover] as const;
}
