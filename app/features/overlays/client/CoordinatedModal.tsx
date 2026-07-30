'use client';

import { type InternalForwardRefRenderFunction } from '@heroui/system';
import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';

import {
	type IModalProps,
	ModalPresentation,
} from '@/design/ui/components/modal';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type {
	IOverlayShortcutDefinition,
	TOverlayId,
} from '@/features/overlays/contracts';

import { useCoordinatedOverlay } from './useCoordinatedOverlay';

interface IModalCoordinationProps {
	canActivate?: () => boolean;
	id: TOverlayId;
	requestOwnership?: 'component' | 'external';
	shortcuts?: ReadonlyArray<IOverlayShortcutDefinition>;
}

interface IProps extends IModalProps {
	coordination: IModalCoordinationProps;
}

function getActiveCoordinatedModal(id: TOverlayId) {
	return [
		...document.querySelectorAll<HTMLElement>(
			'[data-coordinated-overlay-id][data-open="true"]'
		),
	].find(({ dataset }) => dataset['coordinatedOverlayId'] === id);
}

export default memo<IProps>(function CoordinatedModal({
	classNames,
	coordination,
	isDismissable = true,
	isKeyboardDismissDisabled,
	isOpen = false,
	onClose,
	onOpenChange,
	...props
}) {
	const isReducedMotion = useReducedMotion();
	const coordinationId = coordination.id;

	const requestBusinessClose = useCallback(() => {
		onOpenChange?.(false);
		onClose?.();
	}, [onClose, onOpenChange]);

	const {
		isPresentationOpen,
		presentationState,
		shouldSuppressBackdropBlur,
	} = useCoordinatedOverlay({
		canActivate: coordination.canActivate,
		dismissable: isDismissable && !(isKeyboardDismissDisabled ?? false),
		exitDelayMs: isReducedMotion ? 0 : undefined,
		getRootElement: () => getActiveCoordinatedModal(coordinationId) ?? null,
		id: coordinationId,
		isOpen,
		keepOpenWhenCovered: true,
		onRequestClose: requestBusinessClose,
		requestOwnership: coordination.requestOwnership,
		shortcuts: coordination.shortcuts,
	});

	const isCovered = presentationState === 'covered';

	const handleClose = useCallback(() => {
		if (!isCovered) {
			onClose?.();
		}
	}, [isCovered, onClose]);

	const handleOpenChange = useCallback(
		(nextIsOpen: boolean) => {
			if (!isCovered || nextIsOpen) {
				onOpenChange?.(nextIsOpen);
			}
		},
		[isCovered, onOpenChange]
	);

	return (
		<ModalPresentation
			classNames={{
				...classNames,
				backdrop: cn(
					classNames?.backdrop,
					shouldSuppressBackdropBlur && '!backdrop-blur-none'
				),
			}}
			data-coordinated-overlay-id={coordinationId}
			inert={isCovered}
			isDismissable={!isCovered && isDismissable}
			isKeyboardDismissDisabled={
				isCovered || (isKeyboardDismissDisabled ?? false)
			}
			isOpen={isPresentationOpen}
			isReducedMotion={isReducedMotion}
			onClose={handleClose}
			onOpenChange={handleOpenChange}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as ICoordinatedModalProps };
