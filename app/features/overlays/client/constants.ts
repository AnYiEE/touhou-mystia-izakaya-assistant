import type {
	IOverlayDefinition,
	TOverlayId,
} from '@/features/overlays/contracts';

export const MODAL_DEFAULT_EXIT_DELAY_MS = 300;
export const MOBILE_NAV_MENU_EXIT_DELAY_MS = 300;
export const SPOTLIGHT_EXIT_DURATION_MS = 120;
export const SPECIAL_GUEST_PLAN_DRAWER_EXIT_DURATION_MS = 340;

export const OVERLAY_DEFINITION_MAP = {
	'account.data-manager': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'account.legal': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'account.main': { exitDelayMs: 120, priority: 'task' },
	'account.password-required': {
		blockingRank: 200,
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'blocking',
	},
	'account.sync-conflict': {
		blockingRank: 100,
		exitDelayMs: 120,
		priority: 'blocking',
	},
	donation: { exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS, priority: 'passive' },
	'global.search': {
		exitDelayMs: SPOTLIGHT_EXIT_DURATION_MS,
		priority: 'task',
	},
	'navigation.mobile-menu': {
		exitDelayMs: MOBILE_NAV_MENU_EXIT_DELAY_MS,
		priority: 'task',
	},
	'normal-guest.info': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	preferences: { exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS, priority: 'task' },
	'preferences.hidden-beverages': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'preferences.hidden-foods': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'preferences.hidden-ingredients': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'special-guest.info': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'special-guest.plan-drawer': {
		exitDelayMs: SPECIAL_GUEST_PLAN_DRAWER_EXIT_DURATION_MS,
		preserveChildBackdropBlur: true,
		priority: 'task',
	},
} as const satisfies Record<TOverlayId, IOverlayDefinition>;
