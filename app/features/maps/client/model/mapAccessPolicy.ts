import type { IFeatureAccessReasonState } from '@/domain/featureAccess/contracts';

export type TMapAccessMode = 'denied' | 'full' | 'preview';

export type TMapFeatureModuleKey = 'maps.full' | 'maps.preview';

export interface IMapAccessResolutionInput {
	isEnforcementEnabled: boolean;
	isPasswordChangeRequired: boolean;
	modules: Readonly<
		Partial<Record<TMapFeatureModuleKey, IFeatureAccessReasonState>>
	> | null;
}

export interface IMapAccessPolicy {
	canNavigateToMap(map: string): boolean;
	canOpenMapRoute(map: string | null): boolean;
	canOpenSecondaryDetails: boolean;
	canSearch: boolean;
	canToggleLayerGroups: boolean;
	canToggleLayers: boolean;
	canUseHighResolution: boolean;
	maxTileLevel: number | null;
	mode: TMapAccessMode;
}

export function resolveMapAccessMode({
	isEnforcementEnabled,
	isPasswordChangeRequired,
	modules,
}: IMapAccessResolutionInput): TMapAccessMode {
	if (!isEnforcementEnabled) {
		return 'full';
	}
	if (modules === null) {
		return 'preview';
	}

	const isPreviewAllowed = modules['maps.preview']?.allowed === true;
	const isFullAllowed =
		isPreviewAllowed && modules['maps.full']?.allowed === true;

	if (isFullAllowed) {
		return isPasswordChangeRequired ? 'preview' : 'full';
	}
	return isPreviewAllowed ? 'preview' : 'denied';
}

export function createMapAccessPolicy(mode: TMapAccessMode): IMapAccessPolicy {
	const isFull = mode === 'full';
	const canOpenMap = mode !== 'denied';

	return {
		canNavigateToMap: () => canOpenMap,
		canOpenMapRoute: () => canOpenMap,
		canOpenSecondaryDetails: isFull,
		canSearch: isFull,
		canToggleLayerGroups: canOpenMap,
		canToggleLayers: isFull,
		canUseHighResolution: isFull,
		maxTileLevel: isFull ? null : 3,
		mode,
	};
}

export function limitDayMapTileLevel(
	level: number,
	maxTileLevel: number | null
) {
	return maxTileLevel === null ? level : Math.max(level, maxTileLevel);
}
