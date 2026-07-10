import type { IOverlayDefinition, TOverlayId } from './types';

export const MODAL_DEFAULT_EXIT_DELAY_MS = 300;
export const MOBILE_NAV_MENU_EXIT_DELAY_MS = 300;
export const SPOTLIGHT_EXIT_DURATION_MS = 120;
export const CUSTOMER_RARE_PLAN_DRAWER_EXIT_DURATION_MS = 340;

export const OVERLAY_DEFINITION_MAP = {
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
	'customer-normal.info': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'customer-rare.info': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'customer-rare.plan-drawer': {
		exitDelayMs: CUSTOMER_RARE_PLAN_DRAWER_EXIT_DURATION_MS,
		preserveChildBackdropBlur: true,
		priority: 'task',
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
	preferences: { exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS, priority: 'task' },
	'preferences.hidden-beverages': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'preferences.hidden-ingredients': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'preferences.hidden-recipes': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
} as const satisfies Record<TOverlayId, IOverlayDefinition>;
