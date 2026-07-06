import { siteConfig } from '@/configs';

const { name: siteName } = siteConfig;

export const ITEM_SHARE_PARAM_NAME = 'select';

interface ICreateItemShareUrlOptions {
	name: string;
	origin?: string;
	params?: URLSearchParams;
	pathname: string;
}

export function createItemShareUrl({
	name,
	origin,
	params,
	pathname,
}: ICreateItemShareUrlOptions) {
	const newParams = new URLSearchParams(params);
	const resolvedOrigin =
		origin ?? (typeof location === 'undefined' ? '' : location.origin);

	newParams.set(ITEM_SHARE_PARAM_NAME, name);

	return `${resolvedOrigin}${pathname}?${newParams.toString()}`;
}

export function createItemShareData(name: string, url: string): ShareData {
	const text = `在${siteName}上查看【${name}】的详情`;

	return { text, title: text, url };
}
