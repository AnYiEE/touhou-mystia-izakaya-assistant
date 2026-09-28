import { MOTION_DURATION_MS } from '@/design/ui/motion';

import type {
	IOverlayDefinition,
	TOverlayId,
} from '@/features/overlays/contracts';

/** HeroUI Modal 使用 scaleInOut，退出 0.3s。 */
export const MODAL_DEFAULT_EXIT_DELAY_MS = MOTION_DURATION_MS.slow;
/** HeroUI NavbarMenu 的 menuVariants 退出为 0.25s。 */
export const MOBILE_NAV_MENU_EXIT_DELAY_MS = 250;
export const SPECIAL_GUEST_PLAN_DRAWER_EXIT_DURATION_MS =
	MOTION_DURATION_MS.slow;

export const OVERLAY_DEFINITION_MAP = {
	'account.data-manager': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'account.legal': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'account.main': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'task',
	},
	'account.password-required': {
		blockingRank: 200,
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'blocking',
	},
	'account.sync-conflict': {
		blockingRank: 100,
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
		priority: 'blocking',
	},
	donation: { exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS, priority: 'passive' },
	'global.search': {
		exitDelayMs: MODAL_DEFAULT_EXIT_DELAY_MS,
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
