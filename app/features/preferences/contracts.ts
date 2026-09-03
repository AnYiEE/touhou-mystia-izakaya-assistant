export interface ICatalogPreferencesProjection {
	start(): () => void;
}

export type TPreferenceTargetKey =
	| 'account'
	| 'account-login-register'
	| 'account-security'
	| 'account-sync'
	| 'appearance-high-appearance'
	| 'appearance-tachie'
	| 'data-manager'
	| 'experience-vibrate'
	| 'experience-tags-tooltip'
	| 'global-hidden-dlcs'
	| 'global-popular-trend'
	| 'guest-hidden-items'
	| 'special-guest-plan-drawer'
	| 'special-guest-suggest-meals'
	| 'special-guest-order-linked-filter'
	| 'special-guest-show-tag-description';
