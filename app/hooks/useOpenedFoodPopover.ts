import {useCallback, useEffect, useState} from 'react';

import {useParams} from '@/hooks';

export function useOpenedFoodPopover(openedPopoverParam: string) {
	const [params, replace] = useParams();
	const [openedPopover, _setOpenedPopover] = useState('');

	useEffect(() => {
		_setOpenedPopover(params.get(openedPopoverParam) ?? '');
	}, [openedPopoverParam, params]);

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
