import {type RefObject, useCallback, useEffect, useState} from 'react';

import {useParams} from '@/hooks';

export function useOpenedFoodPopover(openedPopoverParam: string, popoverCardRef: RefObject<HTMLElement | null>) {
	const [params, replace] = useParams();
	const [openedPopover, _setOpenedPopover] = useState('');

	useEffect(() => {
		const param = params.get(openedPopoverParam);

		_setOpenedPopover(param ?? '');

		if (openedPopover && param) {
			// Some browsers don't support scrollIntoViewOptions
			try {
				popoverCardRef.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
			} catch {
				popoverCardRef.current?.scrollIntoView();
			}
		}
	}, [openedPopover, openedPopoverParam, params, popoverCardRef]);

	const setOpenedPopover = useCallback(
		(name: typeof openedPopover) => {
			_setOpenedPopover(name);

			const newParams = new URLSearchParams(params);
			if (name) {
				newParams.set(openedPopoverParam, name);
			} else {
				newParams.delete(openedPopoverParam);
			}

			replace(newParams);
		},
		[openedPopoverParam, params, replace]
	);

	return [openedPopover, setOpenedPopover] as const;
}
