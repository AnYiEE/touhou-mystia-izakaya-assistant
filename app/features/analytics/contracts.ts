export const TRACK_CATEGORY_MAP = {
	click: 'Click',
	error: 'Error',
	select: 'Select',
	show: 'Show',
	unselect: 'Unselect',
} as const;

export type TTrackCategory =
	(typeof TRACK_CATEGORY_MAP)[keyof typeof TRACK_CATEGORY_MAP];

type TAction =
	| 'Account'
	| 'Account Auth'
	| 'Account Conflict'
	| 'Account Password'
	| 'Account SSO'
	| 'Account Sync'
	| 'Admin Audit'
	| 'Admin Auth'
	| 'Admin SSO Callback'
	| 'Admin SSO Callback History'
	| 'Admin SSO Client'
	| 'Admin SSO Grant'
	| 'Admin SSO Ticket'
	| 'Admin User Action'
	| 'Admin User Detail'
	| 'Cloud Delete'
	| 'Cloud Download'
	| 'Cloud Upload'
	| 'Customer Rare Plan'
	| 'Customer Rare Plan Drawer'
	| 'Customer Rare Plan Filter'
	| 'Customer Rare Plan Group'
	| 'Customer Rare Plan Meal Source'
	| 'Customer Rare Plan Mode'
	| 'Customer Rare Plan Navigation'
	| 'Customer Rare Plan Sort'
	| 'Donation Modal'
	| 'Error'
	| 'Export'
	| 'Global Search'
	| 'Import'
	| 'Info'
	| 'OpenWindow'
	| 'PIP'
	| 'Remove'
	| 'Reset'
	| 'Save'
	| 'Select'
	| 'Share'
	| 'SSO Authorize'
	| 'Theme'
	| 'Tutorial';

export type TActions = `${TAction} Button` | 'Link';

export type TItem =
	| 'Badge'
	| 'Beverage'
	| 'Clothes'
	| 'Cooker'
	| 'Currency'
	| 'Fishing Collectible'
	| 'Ingredient'
	| 'Item'
	| 'Ornament'
	| 'Partner'
	| 'Record'
	| 'Recipe';

export type TItemAlone = 'Customer' | 'Customer Tag' | 'MystiaCooker';
export type TItemCard = `${TItem} Card`;
export type TAdminSelect = 'Admin User Status';
export type TError = 'Cloud' | 'Global' | 'SSO' | 'Update';
export type TShow = 'Modal' | 'Popover' | 'Tooltip';

export type TTrackAction =
	| TActions
	| TAdminSelect
	| TError
	| TItem
	| TItemAlone
	| TItemCard
	| TShow;

export interface IAnalyticsTracker {
	ping(): void;
	resetUserId(): void;
	setCustomUrl(url: string): void;
	setDocumentTitle(title: string): void;
	setUserId(userId: string): void;
	trackEvent(
		category: TTrackCategory,
		action: TTrackAction,
		name: string,
		value?: number | string
	): void;
	trackPageView(): void;
}

export interface ITrackEvent {
	(
		category: typeof TRACK_CATEGORY_MAP.click,
		action: TActions | TItemCard,
		name: string,
		value?: number | string
	): void;
	(
		category: typeof TRACK_CATEGORY_MAP.error,
		action: TError,
		name: string,
		value?: number | string
	): void;
	(
		category:
			| typeof TRACK_CATEGORY_MAP.select
			| typeof TRACK_CATEGORY_MAP.unselect,
		action: TAdminSelect | TItem | TItemAlone,
		name: string,
		value?: number | string
	): void;
	(
		category: typeof TRACK_CATEGORY_MAP.show,
		action: TShow,
		name: string,
		value?: number | string
	): void;
	category: typeof TRACK_CATEGORY_MAP;
}

export type TTrackEvent = ITrackEvent;
