'use client';

import { type RefObject, useEffect, useMemo, useState } from 'react';

import type { IGuestOrder } from '@/domain/orders/types';

import { useDocumentVisibility } from '@/features/donations/client/hooks/useDocumentVisibility';
import {
	ignoreSupportRecommendationWorkflow,
	trackSupportRecommendationResult,
} from '@/features/donations/client/state/supportNudgeStore';
import {
	SUPPORT_RECOMMENDATION_DWELL_MS,
	createSpecialGuestRecommendationWorkflowKey,
} from '@/features/donations/client/supportNudgePolicy';
import {
	useIsTutorialActive,
	useOverlayIdleForTutorial,
} from '@/features/overlays/client';

interface IOptions {
	cardRef: RefObject<HTMLElement | null>;
	currentGuestOrder: IGuestOrder;
	currentSpecialGuest: null | number;
	hasMystiaCooker: boolean;
	hasRows: boolean;
	isVisible: boolean;
	suggestionStatus: 'error' | 'idle' | 'pending' | 'refreshing' | 'success';
}

export function useSupportRecommendationTracking({
	cardRef,
	currentGuestOrder,
	currentSpecialGuest,
	hasMystiaCooker,
	hasRows,
	isVisible,
	suggestionStatus,
}: IOptions) {
	const isDocumentVisible = useDocumentVisibility();
	const isTutorialActive = useIsTutorialActive();
	const isOverlayIdle = useOverlayIdleForTutorial();

	const [isCardVisible, setIsCardVisible] = useState(false);

	const workflowKey = useMemo(
		() =>
			currentSpecialGuest !== null &&
			currentGuestOrder.foodTag !== null &&
			currentGuestOrder.beverageTag !== null
				? createSpecialGuestRecommendationWorkflowKey({
						beverageTag: currentGuestOrder.beverageTag,
						foodTag: currentGuestOrder.foodTag,
						hasMystiaCooker,
						specialGuest: currentSpecialGuest,
					})
				: null,
		[
			currentGuestOrder.beverageTag,
			currentGuestOrder.foodTag,
			currentSpecialGuest,
			hasMystiaCooker,
		]
	);

	useEffect(() => {
		if (workflowKey === null) {
			return;
		}

		if (isTutorialActive) {
			ignoreSupportRecommendationWorkflow(workflowKey);
		}
	}, [isTutorialActive, workflowKey]);

	useEffect(() => {
		const card = cardRef.current;
		if (card === null || !isVisible || !hasRows) {
			setIsCardVisible(false);
			return;
		}

		const checkVisibility = () => {
			if (!isDocumentVisible) {
				setIsCardVisible(false);
				return;
			}
			const rect = card.getBoundingClientRect();
			const visibleHeight = Math.max(
				0,
				Math.min(rect.bottom, globalThis.innerHeight) -
					Math.max(rect.top, 0)
			);
			setIsCardVisible(
				visibleHeight >=
					Math.min(rect.height, globalThis.innerHeight) * 0.5
			);
		};

		checkVisibility();
		globalThis.addEventListener('resize', checkVisibility);
		globalThis.addEventListener('scroll', checkVisibility, {
			passive: true,
		});

		return () => {
			globalThis.removeEventListener('resize', checkVisibility);
			globalThis.removeEventListener('scroll', checkVisibility);
		};
	}, [cardRef, hasRows, isDocumentVisible, isVisible]);

	useEffect(() => {
		if (
			workflowKey === null ||
			suggestionStatus !== 'success' ||
			!hasRows ||
			!isVisible ||
			!isCardVisible ||
			!isDocumentVisible ||
			!isOverlayIdle ||
			isTutorialActive
		) {
			return;
		}

		const timeout = setTimeout(() => {
			if (document.visibilityState !== 'visible') {
				return;
			}
			trackSupportRecommendationResult(workflowKey);
		}, SUPPORT_RECOMMENDATION_DWELL_MS);

		return () => {
			clearTimeout(timeout);
		};
	}, [
		hasRows,
		isCardVisible,
		isDocumentVisible,
		isOverlayIdle,
		isTutorialActive,
		isVisible,
		suggestionStatus,
		workflowKey,
	]);
}
