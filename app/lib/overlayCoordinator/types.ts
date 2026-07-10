export type TOverlayId =
	| 'account.legal'
	| 'account.main'
	| 'account.password-required'
	| 'account.sync-conflict'
	| 'customer-normal.info'
	| 'customer-rare.info'
	| 'customer-rare.plan-drawer'
	| 'donation'
	| 'global.search'
	| 'navigation.mobile-menu'
	| 'preferences'
	| 'preferences.hidden-beverages'
	| 'preferences.hidden-ingredients'
	| 'preferences.hidden-recipes';

export type TOverlayPriority = 'blocking' | 'passive' | 'task';

export type TOverlayPresentationState =
	| 'active'
	| 'closed'
	| 'closing'
	| 'covered'
	| 'opening'
	| 'queued';

export type TOverlayCloseReason = 'coordinator' | 'escape';

export type TOverlayRequestResult =
	| { status: 'activated' }
	| { status: 'queued' }
	| {
			reason:
				| 'blocking-active'
				| 'parent-inactive'
				| 'task-active'
				| 'transition-active'
				| 'tutorial-active';
			status: 'rejected';
	  }
	| { status: 'stale' };

export interface IOverlayDefinition {
	blockingRank?: number;
	exitDelayMs: number;
	preserveChildBackdropBlur?: boolean;
	priority: TOverlayPriority;
}

export interface IOverlayRegistration {
	canActivate?: () => boolean;
	dismissable?: () => boolean;
	exitDelayMs?: number;
	getRootElement?: () => HTMLElement | null;
	id: TOverlayId;
	onRequestClose?: (reason: TOverlayCloseReason) => void;
	shortcuts?: ReadonlyArray<IOverlayShortcutDefinition>;
}

export interface IOverlayShortcutDefinition {
	canHandle?: (event: KeyboardEvent) => boolean;
	matches: (event: KeyboardEvent) => boolean;
	onTrigger: () => void;
}

export interface IOverlayShortcutDispatchResult {
	handled: boolean;
	matched: boolean;
}

export interface IOverlayCoordinatorSnapshot {
	activeBlockerId: null | TOverlayId;
	isBlockingTransition: boolean;
	isTaskTransition: boolean;
	isTutorialActive: boolean;
	passiveActiveId: null | TOverlayId;
	passiveQueue: TOverlayId[];
	pendingBlockerId: null | TOverlayId;
	pendingTaskId: null | TOverlayId;
	taskStack: TOverlayId[];
}

export interface IOverlayOpenOptions {
	onActivate?: () => void;
}

export interface IOverlayHandoffOptions {
	fromId: TOverlayId;
	isValid?: () => boolean;
	onCloseSource: () => void;
	onOpenTarget: () => void;
	toId: TOverlayId;
}

export interface IOverlayPushChildOptions {
	childId: TOverlayId;
	onOpenChild: () => void;
	parentId: TOverlayId;
}

export interface ITutorialLease {
	release: () => void;
}
