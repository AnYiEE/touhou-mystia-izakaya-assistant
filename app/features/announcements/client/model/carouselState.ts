import { type IAnnouncementPublicItem } from '@/features/announcements/contracts';
import {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	appendAnnouncementDismissalToken,
	parseAnnouncementDismissedCookieValue,
	serializeAnnouncementDismissedCookieTokens,
} from '@/features/announcements/dismissals';
import type { IDeploymentMaintenancePublicState } from '@/features/siteStatus/contracts';

export const MAINTENANCE_TOKEN_PREFIX = 'maintenance:';

export type TAnnouncementTransitionDirection = 'next' | 'previous';

export interface IAnnouncementTransition {
	direction: TAnnouncementTransitionDirection;
	fromItem: IAnnouncementPublicItem;
	toItem: IAnnouncementPublicItem;
}

export function createMaintenanceAnnouncement(
	maintenance: IDeploymentMaintenancePublicState | null
): IAnnouncementPublicItem | null {
	if (maintenance === null) {
		return null;
	}

	const token = `${MAINTENANCE_TOKEN_PREFIX}${maintenance.id}`;

	return {
		audience: 'all',
		dismissed_token: token,
		dismissible: false,
		ends_at: maintenance.expires_at,
		html: maintenance.message,
		id: token,
		level: maintenance.level,
		priority: Number.MAX_SAFE_INTEGER,
		revision: 1,
		starts_at: maintenance.started_at,
		title: '系统维护',
		updated_at: maintenance.started_at,
	};
}

export function findAnnouncementByToken(
	items: IAnnouncementPublicItem[],
	token: string | null
) {
	return token === null
		? null
		: (items.find((item) => item.dismissed_token === token) ?? null);
}

export function checkMaintenanceAnnouncement(item: IAnnouncementPublicItem) {
	return item.dismissed_token.startsWith(MAINTENANCE_TOKEN_PREFIX);
}

export function getOrdinaryAnnouncements(items: IAnnouncementPublicItem[]) {
	return items.filter((item) => !checkMaintenanceAnnouncement(item));
}

export function prepareMaintenanceAnnouncementItems({
	currentItems,
	currentVisualItem,
	maintenanceItem,
	previousMaintenanceToken,
}: {
	currentItems: IAnnouncementPublicItem[];
	currentVisualItem: IAnnouncementPublicItem | null;
	maintenanceItem: IAnnouncementPublicItem;
	previousMaintenanceToken: string | null;
}) {
	const ordinaryItems = getOrdinaryAnnouncements(currentItems);
	const previousMaintenanceItem =
		previousMaintenanceToken === null
			? null
			: findAnnouncementByToken(currentItems, previousMaintenanceToken);
	const shouldKeepPreviousMaintenance =
		previousMaintenanceItem !== null &&
		currentVisualItem?.dismissed_token === previousMaintenanceToken;

	return {
		nextItems: [
			maintenanceItem,
			...(shouldKeepPreviousMaintenance ? [previousMaintenanceItem] : []),
			...ordinaryItems,
		],
		pendingRemovalToken: shouldKeepPreviousMaintenance
			? previousMaintenanceToken
			: null,
	};
}

export function prepareMaintenanceAnnouncementExit({
	currentItems,
	currentVisualItem,
	previousMaintenanceToken,
}: {
	currentItems: IAnnouncementPublicItem[];
	currentVisualItem: IAnnouncementPublicItem | null;
	previousMaintenanceToken: string | null;
}) {
	const ordinaryItems = getOrdinaryAnnouncements(currentItems);

	return {
		ordinaryItems,
		shouldTransitionFromMaintenance:
			previousMaintenanceToken !== null &&
			currentVisualItem?.dismissed_token === previousMaintenanceToken,
	};
}

export function selectAnnouncementForDirection({
	direction,
	displayToken,
	items,
	pendingRemovalToken,
	transition,
}: {
	direction: TAnnouncementTransitionDirection;
	displayToken: string | null;
	items: IAnnouncementPublicItem[];
	pendingRemovalToken: string | null;
	transition: IAnnouncementTransition | null;
}) {
	const navigableItems = items.filter(
		(item) => item.dismissed_token !== pendingRemovalToken
	);

	if (navigableItems.length <= 1) {
		return null;
	}

	const sourceToken = transition?.toItem.dismissed_token ?? displayToken;
	const sourceIndex = navigableItems.findIndex(
		(item) => item.dismissed_token === sourceToken
	);
	const nextIndex =
		sourceIndex === -1
			? direction === 'previous'
				? navigableItems.length - 1
				: 0
			: direction === 'previous'
				? (sourceIndex - 1 + navigableItems.length) %
					navigableItems.length
				: (sourceIndex + 1) % navigableItems.length;
	const nextItem = navigableItems[nextIndex];

	return nextItem === undefined ? null : { nextItem, sourceToken };
}

export function removePendingAnnouncement(
	items: IAnnouncementPublicItem[],
	pendingRemovalToken: string
) {
	return items.filter((item) => item.dismissed_token !== pendingRemovalToken);
}

export function selectAnnouncementAfterDismissal({
	dismissedToken,
	items,
	pendingRemovalToken,
}: {
	dismissedToken: string;
	items: IAnnouncementPublicItem[];
	pendingRemovalToken: string | null;
}) {
	const dismissedIndex = items.findIndex(
		(item) => item.dismissed_token === dismissedToken
	);
	const nextItems = items.filter(
		(item) =>
			item.dismissed_token !== dismissedToken &&
			item.dismissed_token !== pendingRemovalToken
	);
	const nextItem =
		nextItems[
			Math.min(Math.max(dismissedIndex, 0), nextItems.length - 1)
		] ?? null;

	return { nextItem, nextItems };
}

export function createAnnouncementDismissedCookieAssignment({
	cookie,
	protocol,
	token,
}: {
	cookie: string;
	protocol: string;
	token: string;
}) {
	const cookieValue =
		cookie
			.split('; ')
			.find((item) =>
				item.startsWith(`${ANNOUNCEMENT_DISMISSED_COOKIE_NAME}=`)
			)
			?.split('=', 2)[1] ?? null;
	const tokens = parseAnnouncementDismissedCookieValue(cookieValue);
	const nextValue = serializeAnnouncementDismissedCookieTokens(
		appendAnnouncementDismissalToken(tokens, token)
	);
	const secureAttribute = protocol === 'https:' ? '; secure' : '';

	return `${ANNOUNCEMENT_DISMISSED_COOKIE_NAME}=${nextValue}; path=/; max-age=31536000; samesite=lax${secureAttribute}`;
}

export function reconcileServerAnnouncements({
	activeToken,
	currentItems,
	displayToken,
	pendingRemovalToken,
	serverAnnouncements,
	transition,
}: {
	activeToken: string | null;
	currentItems: IAnnouncementPublicItem[];
	displayToken: string | null;
	pendingRemovalToken: string | null;
	serverAnnouncements: IAnnouncementPublicItem[];
	transition: IAnnouncementTransition | null;
}) {
	const maintenanceItems = currentItems.filter(checkMaintenanceAnnouncement);
	let nextPendingRemovalToken = pendingRemovalToken;
	let nextItems = [...maintenanceItems, ...serverAnnouncements];
	let selectableTokens = new Set(
		nextItems
			.filter((item) => item.dismissed_token !== nextPendingRemovalToken)
			.map((item) => item.dismissed_token)
	);
	const transitionTargetInvalid =
		transition !== null &&
		!selectableTokens.has(transition.toItem.dismissed_token);
	const pendingDisplayAllowed =
		nextPendingRemovalToken !== null &&
		transition !== null &&
		!transitionTargetInvalid &&
		transition.fromItem.dismissed_token === nextPendingRemovalToken &&
		displayToken === nextPendingRemovalToken;
	const activeTokenInvalid =
		activeToken !== null && !selectableTokens.has(activeToken);
	const displayTokenInvalid =
		displayToken !== null &&
		!selectableTokens.has(displayToken) &&
		!pendingDisplayAllowed;

	if (transitionTargetInvalid && nextPendingRemovalToken !== null) {
		nextItems = nextItems.filter(
			(item) => item.dismissed_token !== nextPendingRemovalToken
		);
		nextPendingRemovalToken = null;
		selectableTokens = new Set(
			nextItems.map((item) => item.dismissed_token)
		);
	}

	const currentVisualToken =
		transition !== null && !transitionTargetInvalid
			? transition.toItem.dismissed_token
			: displayToken;
	const fallbackToken =
		(currentVisualToken !== null && selectableTokens.has(currentVisualToken)
			? currentVisualToken
			: nextItems.find((item) =>
					selectableTokens.has(item.dismissed_token)
				)?.dismissed_token) ?? null;

	return {
		activeTokenInvalid,
		displayTokenInvalid,
		fallbackToken,
		nextItems,
		nextPendingRemovalToken,
		selectableTokens,
		transitionTargetInvalid,
	};
}
