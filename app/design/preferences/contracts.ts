import type { ReactNode } from 'react';

export interface IDesignPreferences {
	isHighAppearance: boolean;
}

export interface IDesignPreferencesProviderProps {
	children: ReactNode;
	value: IDesignPreferences;
}
