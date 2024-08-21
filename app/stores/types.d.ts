export interface IPersistenceState<T = unknown> {
	state: {
		persistence: Partial<T>;
	};
}
