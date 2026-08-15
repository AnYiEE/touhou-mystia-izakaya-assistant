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
	if (
		base !== null &&
		checkThemeSnapshotsEqual(cloud, base) &&
		!checkThemeSnapshotsEqual(local, base)
	) {
		return {
			conflict: null,
			data: local,
			requiresConfirmation: false,
			shouldUpload: true,
		};
	}

	return {
		conflict: null,
		data: cloud,
		requiresConfirmation: false,
		shouldUpload: false,
	};
}
