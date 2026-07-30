'use client';

import { createContext, useContext } from 'react';

import type {
	IDesignPreferences,
	IDesignPreferencesProviderProps,
} from './contracts';

const DEFAULT_DESIGN_PREFERENCES: IDesignPreferences = {
	isHighAppearance: true,
};

const DesignPreferencesContext = createContext<IDesignPreferences>(
	DEFAULT_DESIGN_PREFERENCES
);

export function DesignPreferencesProvider({
	children,
	value,
}: IDesignPreferencesProviderProps) {
	return (
		<DesignPreferencesContext value={value}>
			{children}
		</DesignPreferencesContext>
	);
}

export function useDesignPreferences() {
	return useContext(DesignPreferencesContext);
}
