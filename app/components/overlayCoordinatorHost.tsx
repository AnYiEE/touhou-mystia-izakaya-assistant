'use client';

import {
	useEffect,
	useLayoutEffect,
	useState,
	useSyncExternalStore,
} from 'react';

import { Modal } from '@/design/ui/components';

import {
	getOverlayCoordinatorSnapshot,
	handleOverlayCoordinatorKeyDown,
	subscribeOverlayCoordinator,
} from '@/lib/overlayCoordinator';

function getOutsidePortalInteractionRoots(portalContainer: HTMLElement) {
	const roots = new Set<HTMLElement>();
	let currentElement = portalContainer;
	let { parentElement } = currentElement;

	while (parentElement !== null) {
		for (const sibling of parentElement.children) {
			if (sibling !== currentElement && sibling instanceof HTMLElement) {
				roots.add(sibling);
			}
		}

		if (parentElement === document.body) {
			break;
		}

		currentElement = parentElement;
		parentElement = parentElement.parentElement;
	}

	return roots;
}

export default function OverlayCoordinatorHost() {
	const snapshot = useSyncExternalStore(
		subscribeOverlayCoordinator,
		getOverlayCoordinatorSnapshot,
		getOverlayCoordinatorSnapshot
	);
	const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
		null
	);
	const [preparationTimedOut, setPreparationTimedOut] = useState(false);
	const [visibleBlockerId, setVisibleBlockerId] = useState<null | string>(
		null
	);
	const [preparationReadyForId, setPreparationReadyForId] = useState<
		null | string
	>(null);
	const hasBlockingState =
		snapshot.activeBlockerId !== null ||
		snapshot.pendingBlockerId !== null ||
		snapshot.isBlockingTransition;

	useEffect(() => {
		globalThis.addEventListener(
			'keydown',
			handleOverlayCoordinatorKeyDown,
			{ capture: true }
		);

		return () => {
			globalThis.removeEventListener(
				'keydown',
				handleOverlayCoordinatorKeyDown,
				{ capture: true }
			);
		};
	}, []);

	useEffect(() => {
		setPortalContainer(document.querySelector('#modal-portal-container'));
	}, []);

	useEffect(() => {
		if (portalContainer === null || !hasBlockingState) {
			return;
		}

		const previousInertStates = new Map<HTMLElement, boolean>();
		const applyInert = () => {
			for (const root of getOutsidePortalInteractionRoots(
				portalContainer
			)) {
				if (!previousInertStates.has(root)) {
					previousInertStates.set(root, root.inert);
					root.inert = true;
				}
			}
		};
		applyInert();

		const observer = new MutationObserver(applyInert);
		let currentElement = portalContainer;
		let { parentElement } = currentElement;
		while (parentElement !== null) {
			observer.observe(parentElement, { childList: true });
			if (parentElement === document.body) {
				break;
			}
			currentElement = parentElement;
			parentElement = currentElement.parentElement;
		}

		return () => {
			observer.disconnect();
			previousInertStates.forEach((wasInert, root) => {
				root.inert = wasInert;
			});
		};
	}, [hasBlockingState, portalContainer]);

	const blockerId = snapshot.activeBlockerId ?? snapshot.pendingBlockerId;
	const activeBlockerIdForPreparation = snapshot.activeBlockerId;

	useLayoutEffect(() => {
		if (
			portalContainer === null ||
			activeBlockerIdForPreparation === null
		) {
			setVisibleBlockerId(null);
			setPreparationReadyForId(null);
			return;
		}

		let preparationFrame: null | number = null;
		const checkVisibleBlocker = () =>
			portalContainer.querySelector(
				`[data-coordinated-overlay-id="${CSS.escape(activeBlockerIdForPreparation)}"][data-open="true"]`
			) !== null;
		const updateVisibleBlocker = () => {
			const isVisible = checkVisibleBlocker();
			setVisibleBlockerId(
				isVisible ? activeBlockerIdForPreparation : null
			);
			if (isVisible) {
				if (preparationFrame !== null) {
					cancelAnimationFrame(preparationFrame);
					preparationFrame = null;
				}
				setPreparationReadyForId(null);
				return;
			}

			preparationFrame ??= requestAnimationFrame(() => {
				preparationFrame = null;
				if (!checkVisibleBlocker()) {
					setPreparationReadyForId(activeBlockerIdForPreparation);
				}
			});
		};

		setPreparationReadyForId(null);
		updateVisibleBlocker();
		const observer = new MutationObserver(updateVisibleBlocker);
		observer.observe(portalContainer, {
			attributeFilter: ['data-coordinated-overlay-id', 'data-open'],
			attributes: true,
			childList: true,
			subtree: true,
		});

		return () => {
			observer.disconnect();
			if (preparationFrame !== null) {
				cancelAnimationFrame(preparationFrame);
			}
		};
	}, [activeBlockerIdForPreparation, portalContainer]);

	const hasVisibleBlockerRoot =
		visibleBlockerId === activeBlockerIdForPreparation;
	const shouldShowPreparation =
		hasBlockingState &&
		activeBlockerIdForPreparation !== null &&
		!hasVisibleBlockerRoot &&
		preparationReadyForId === activeBlockerIdForPreparation;

	useEffect(() => {
		setPreparationTimedOut(false);
		if (!shouldShowPreparation) {
			return;
		}

		const timeout = setTimeout(() => {
			setPreparationTimedOut(true);
		}, 1000);

		return () => {
			clearTimeout(timeout);
		};
	}, [blockerId, shouldShowPreparation]);

	if (portalContainer === null || !shouldShowPreparation) {
		return null;
	}

	return (
		<Modal
			hideCloseButton
			isKeyboardDismissDisabled
			isOpen
			isDismissable={false}
			portalContainer={portalContainer}
			scrollShadow={false}
			size="sm"
			aria-label="账号阻断状态准备中"
			classNames={{ body: 'py-5 text-center text-small' }}
		>
			<p aria-live="polite" role="status">
				{preparationTimedOut
					? '当前版本暂时无法打开账号处理面板，请刷新页面或更新应用。'
					: blockerId === 'account.password-required'
						? '正在准备账号安全验证…'
						: '正在准备云同步冲突处理…'}
			</p>
		</Modal>
	);
}
