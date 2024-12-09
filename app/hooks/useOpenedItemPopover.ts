import {type RefObject, useCallback, useEffect, useState} from 'react';

import {useParams} from '@/hooks';

export const PARAM_SPECIFY = 'select';

export function useOpenedItemPopover(popoverCardRef: RefObject<HTMLElement | null>) {
	const [params, replace] = useParams();
	const [openedPopover, _setOpenedPopover] = useState<string | null>(null);

	useEffect(() => {
		const param = params.get(PARAM_SPECIFY);

		_setOpenedPopover(param);

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
	}, [openedPopover, params, popoverCardRef]);

	const setOpenedPopover = useCallback(
		(name: typeof openedPopover) => {
			_setOpenedPopover(name);

			const newParams = new URLSearchParams(params);
			if (name === null) {
				newParams.delete(PARAM_SPECIFY);
			} else {
				newParams.set(PARAM_SPECIFY, name);
			}

			replace(newParams);
		},
		[params, replace]
	);

	return [openedPopover, setOpenedPopover] as const;
}
