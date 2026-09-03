import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import { specialGuestPlansShape } from '@/features/account/sync/shapes/specialGuestPlans';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	readSpecialGuestPlansPersistenceSnapshot,
	replaceSpecialGuestPlansPersistenceSnapshot,
} from '@/features/specialGuestPlans/client/state/accountSync';
import type { ISpecialGuestPlansState } from '@/features/specialGuestPlans/contracts';

import { mergeSpecialGuestPlansSnapshots } from './specialGuestPlansMerge';
import {
	checkSnapshotEqual,
	createMergeResult,
	createSerializerConflict,
} from './utils';

export const specialGuestPlansSerializer: ISyncNamespaceSerializer<ISpecialGuestPlansState> =
	{
		deserialize(data) {
			return specialGuestPlansSerializer.migrate(
				data,
				SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.specialGuestPlans]
			);
		},
		getDefaultSnapshot() {
			return specialGuestPlansShape.createDefault();
		},
		getLocalSnapshot() {
			const data = structuredClone(
				readSpecialGuestPlansPersistenceSnapshot()
			);
			return specialGuestPlansShape.normalize(data);
		},
		merge({ base, cloud, local, namespace }) {
			const localSnapshot = specialGuestPlansShape.normalize(local);
			if (cloud === null) {
				return createMergeResult({
					data: localSnapshot,
					shouldUpload: !checkSnapshotEqual(
						localSnapshot,
						specialGuestPlansSerializer.getDefaultSnapshot()
					),
				});
			}

			const cloudSnapshot = specialGuestPlansShape.normalize(cloud);
			if (base === null) {
				if (
					checkSnapshotEqual(localSnapshot, cloudSnapshot) ||
					checkSnapshotEqual(
						localSnapshot,
						specialGuestPlansSerializer.getDefaultSnapshot()
					)
				) {
					return createMergeResult({
						data: cloudSnapshot,
						shouldUpload: false,
					});
				}
				if (
					checkSnapshotEqual(
						cloudSnapshot,
						specialGuestPlansSerializer.getDefaultSnapshot()
					)
				) {
					return createMergeResult({
						data: localSnapshot,
						shouldUpload: true,
					});
				}
			}

			const baseSnapshot =
				base === null ? null : specialGuestPlansShape.normalize(base);
			const merged = mergeSpecialGuestPlansSnapshots({
				base: baseSnapshot,
				cloud: cloudSnapshot,
				local: localSnapshot,
			});

			if (merged.hasConflict) {
				return createMergeResult({
					conflict: createSerializerConflict({
						cloud: cloudSnapshot,
						local: localSnapshot,
						namespace,
						userId: '',
					}),
					data: cloudSnapshot,
					shouldUpload: false,
				});
			}

			return createMergeResult({
				data: merged.data,
				requiresConfirmation: merged.requiresConfirmation,
				shouldUpload: !checkSnapshotEqual(merged.data, cloudSnapshot),
			});
		},
		migrate(data, version): ISpecialGuestPlansState {
			return specialGuestPlansShape.migrate(data, version);
		},
		serialize(data) {
			return specialGuestPlansShape.normalize(data);
		},
		setLocalSnapshot(data) {
			replaceSpecialGuestPlansPersistenceSnapshot(
				specialGuestPlansShape.normalize(data)
			);
		},
		validate(data): data is ISpecialGuestPlansState {
			return specialGuestPlansShape.validate(data);
		},
	} satisfies ISyncNamespaceSerializer<ISpecialGuestPlansState>;
