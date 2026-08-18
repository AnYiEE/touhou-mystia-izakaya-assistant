import type { IThemePreferences } from '@/design/theme/runtime/types';

function checkThemeSnapshotsEqual(
	left: IThemePreferences,
	right: IThemePreferences
) {
	return (
		left.darkPalette === right.darkPalette &&
		left.lightPalette === right.lightPalette &&
		left.mode === right.mode
	);
}

function mergeThemeField<T>({
	base,
	cloud,
	local,
}: {
	base: T;
	cloud: T;
	local: T;
}) {
	if (cloud === local || local === base) {
		return cloud;
	}
	if (cloud === base) {
		return local;
	}

	return cloud;
}

export function mergeThemeSnapshots({
	base,
	cloud,
	defaultSnapshot,
	local,
}: {
	base: IThemePreferences | null;
	cloud: IThemePreferences | null;
	defaultSnapshot: IThemePreferences;
	local: IThemePreferences;
}) {
	if (cloud === null) {
		return {
			conflict: null,
			data: local,
			requiresConfirmation: false,
			shouldUpload: !checkThemeSnapshotsEqual(local, defaultSnapshot),
		};
	}
	if (checkThemeSnapshotsEqual(cloud, local)) {
		return {
			conflict: null,
			data: cloud,
			requiresConfirmation: false,
			shouldUpload: false,
		};
	}
	if (base !== null) {
		const data = {
			darkPalette: mergeThemeField({
				base: base.darkPalette,
				cloud: cloud.darkPalette,
				local: local.darkPalette,
			}),
			lightPalette: mergeThemeField({
				base: base.lightPalette,
				cloud: cloud.lightPalette,
				local: local.lightPalette,
			}),
			mode: mergeThemeField({
				base: base.mode,
				cloud: cloud.mode,
				local: local.mode,
			}),
		};

		return {
			conflict: null,
			data,
			requiresConfirmation: false,
			shouldUpload: !checkThemeSnapshotsEqual(data, cloud),
		};
	}

	return {
		conflict: null,
		data: cloud,
		requiresConfirmation: false,
		shouldUpload: false,
	};
}
