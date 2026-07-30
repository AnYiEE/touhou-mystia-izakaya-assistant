import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

export function createMainSiteUrl(path: string) {
	return new URL(path, PUBLIC_RUNTIME_CONFIG.baseOrigin);
}
