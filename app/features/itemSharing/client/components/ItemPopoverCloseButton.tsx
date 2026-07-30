'use client';

import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { debounce } from 'lodash';
import { memo, useCallback } from 'react';

import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import { usePopoverContext } from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { useParams } from '@/features/appShell/client/navigation/useParams';
import {
	ITEM_PREVIEW_PARAM_NAME,
	ITEM_SHARE_PARAM_NAME,
} from '@/features/itemSharing/contracts';

import { checkA11yConfirmKey } from '@/shared/utilities/interaction/checkA11yConfirmKey';

export const ItemPopoverCloseButton = memo(function ItemPopoverCloseButton() {
	const { params, replaceState } = useParams();
	const { onClose } = usePopoverContext();

	const isPreviewMode = params.has(ITEM_PREVIEW_PARAM_NAME);

	const handleClose = useCallback(() => {
		onClose();

		if (isPreviewMode) {
			globalThis.close();
		}

		if (params.has(ITEM_SHARE_PARAM_NAME)) {
			const newParams = new URLSearchParams(params);

			newParams.delete(ITEM_SHARE_PARAM_NAME);
			replaceState(newParams);
		}
	}, [isPreviewMode, onClose, params, replaceState]);

	const label = `点击：关闭${isPreviewMode ? '窗口' : '弹出框'}`;

	return (
		<Tooltip
			showArrow
			content={label}
			offset={3}
			placement="left"
			size="sm"
		>
			<FontAwesomeIconButton
				icon={faXmark}
				variant="light"
				onClick={handleClose}
				onKeyDown={debounce(checkA11yConfirmKey(handleClose))}
				aria-label={label}
				className="absolute right-1 top-1 z-20 h-4 w-4 min-w-0 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
			/>
		</Tooltip>
	);
});
