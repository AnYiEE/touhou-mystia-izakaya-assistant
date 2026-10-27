import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

export function getMapAssetBaseUrl() {
	return PUBLIC_RUNTIME_CONFIG.isSelfHosted
		? '/api/v1/maps/assets'
		: '/assets/maps';
}
