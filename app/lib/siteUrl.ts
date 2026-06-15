import { siteConfig } from '@/configs';

export function createMainSiteUrl(path: string) {
	return new URL(path, siteConfig.baseOrigin);
}
