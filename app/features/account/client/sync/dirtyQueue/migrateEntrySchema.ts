import type {
	IDirtyQueueEntry,
	ISyncConflictItem,
	ISyncNamespaceSerializer,
} from '@/features/account/sync/types';

import { createSnapshotHash } from './snapshotHash';

function migrateConflict({
	conflict,
	serializer,
	sourceSchemaVersion,
	targetSchemaVersion,
}: {
	conflict: ISyncConflictItem;
	serializer: ISyncNamespaceSerializer<unknown>;
	sourceSchemaVersion: number;
	targetSchemaVersion: number;
}): ISyncConflictItem {
	return {
		...conflict,
		cloud: serializer.migrate(conflict.cloud, sourceSchemaVersion),
		local: serializer.migrate(conflict.local, sourceSchemaVersion),
		...(conflict.localCollision === undefined
			? {}
			: {
					localCollision: {
						...conflict.localCollision,
						candidates: conflict.localCollision.candidates.map(
							(candidate) => {
								const data = serializer.migrate(
									candidate.data,
									candidate.schemaVersion
								);

								return {
									...candidate,
									data,
									schemaVersion: targetSchemaVersion,
									snapshotHash: createSnapshotHash(data),
								};
							}
						),
					},
				}),
		merged:
			conflict.merged === null
				? null
				: serializer.migrate(conflict.merged, sourceSchemaVersion),
	};
}

export function migrateDirtyQueueEntrySchema({
	entry,
	serializer,
	targetSchemaVersion,
}: {
	entry: IDirtyQueueEntry;
	serializer: ISyncNamespaceSerializer<unknown>;
	targetSchemaVersion: number;
}): IDirtyQueueEntry {
	const data = serializer.migrate(entry.data, entry.schema_version);

	return {
		...entry,
		conflict:
			entry.conflict === null
				? null
				: migrateConflict({
						conflict: entry.conflict,
						serializer,
						sourceSchemaVersion: entry.schema_version,
						targetSchemaVersion,
					}),
		data,
		schema_version: targetSchemaVersion,
		snapshotHash: createSnapshotHash(data),
	};
}
