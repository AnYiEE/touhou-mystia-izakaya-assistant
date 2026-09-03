interface IVersionedMigratorOptions {
	currentVersion: number;
	minVersion: number;
	migrations: Record<number, (value: unknown) => unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function createVersionedMigrator<T = unknown>({
	currentVersion,
	migrations,
	minVersion,
}: IVersionedMigratorOptions) {
	return (value: unknown, fromVersion: number): T => {
		if (
			!Number.isSafeInteger(fromVersion) ||
			fromVersion < minVersion ||
			fromVersion > currentVersion
		) {
			throw new Error('unsupported-persisted-state-version');
		}

		let migrated = structuredClone(value);
		for (
			let version = fromVersion;
			version < currentVersion;
			version += 1
		) {
			const step = migrations[version];
			if (step === undefined) {
				throw new Error(`missing-persisted-state-migration:${version}`);
			}
			migrated = step(migrated);
		}

		return migrated as T;
	};
}
