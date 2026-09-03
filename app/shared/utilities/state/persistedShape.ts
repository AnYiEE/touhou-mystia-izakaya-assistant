export interface IPersistedShape<T> {
	createDefault(): T;
	migrate?(value: unknown, version: number): T;
	normalize(value: unknown): T;
	validate(value: unknown): value is T;
}

export interface IMigratablePersistedShape<T> extends IPersistedShape<T> {
	migrate(value: unknown, version: number): T;
}

export interface ILocalPersistedShape<T> extends IPersistedShape<T> {
	readonly currentVersion: number;
}
