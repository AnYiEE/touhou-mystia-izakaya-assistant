import { useCallback, useRef } from 'react';

const UNSET_SCOPE = Symbol('unset-saved-meal-list-key-scope');

interface IKeyState {
	nextId: number;
	scope: unknown;
	values: string[];
}

export function useSavedMealListKeys(
	scope: unknown,
	meals: ReadonlyArray<unknown> | null
) {
	const keyStateRef = useRef<IKeyState>({
		nextId: 0,
		scope: UNSET_SCOPE,
		values: [],
	});
	const keyState = keyStateRef.current;

	if (keyState.scope !== scope) {
		keyState.nextId = 0;
		keyState.scope = scope;
		keyState.values = [];
	}

	const mealLength = meals?.length ?? 0;
	while (keyState.values.length < mealLength) {
		keyState.values.push(`saved-meal-${keyState.nextId}`);
		keyState.nextId += 1;
	}
	if (keyState.values.length > mealLength) {
		keyState.values.length = mealLength;
	}

	const getSavedMealKey = useCallback(
		(dataIndex: number) =>
			keyStateRef.current.values[dataIndex] ??
			`saved-meal-fallback-${dataIndex}`,
		[]
	);

	const removeSavedMealKey = useCallback((savedMealKey: string) => {
		const index = keyStateRef.current.values.indexOf(savedMealKey);
		if (index === -1) {
			return;
		}

		keyStateRef.current.values.splice(index, 1);
	}, []);

	return { getSavedMealKey, removeSavedMealKey };
}
