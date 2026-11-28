export const LOGIN_GATE_MODULE_KEYS = [
	'catalog.itemDetails',
	'guest.details',
	'recommendation.suggestedMeals',
	'recommendation.specialGuestPlans',
	'meal.save',
] as const;

export type TLoginGateModuleKey = (typeof LOGIN_GATE_MODULE_KEYS)[number];

/**
 * `full`: the host renders exactly as it does without a gate.
 * `preview`: the first sample stays clear and the rest is veiled.
 */
export type TLoginGateMode = 'full' | 'preview';

/** What the hidden remainder of a repeated group consists of. */
export type TLoginGateCountKind = 'details' | 'dialogues' | 'recommendations';
