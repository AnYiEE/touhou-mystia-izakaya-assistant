import { SITE_METADATA } from '@/shared/site/metadata';

import { ITEM_SHARE_PARAM_NAME } from './contracts';

const { name: siteName } = SITE_METADATA;
const ITEM_SHARE_RECORD_ID_PATTERN = /^(?:0|[1-9]\d*)$/u;

export interface ICreateItemShareUrlOptions {
	origin?: string;
	params?: URLSearchParams;
	pathname: string;
	recordId: number;
}

export function createItemShareUrl({
	origin,
	params,
	pathname,
	recordId,
}: ICreateItemShareUrlOptions) {
	const newParams = new URLSearchParams(params);
	const resolvedOrigin =
		origin ?? (typeof location === 'undefined' ? '' : location.origin);

	newParams.set(ITEM_SHARE_PARAM_NAME, String(recordId));

	return `${resolvedOrigin}${pathname}?${newParams.toString()}`;
}

export function createItemShareData(name: string, url: string): ShareData {
	const text = `在${siteName}上查看【${name}】的详情`;

	return { text, title: text, url };
}

export function parseItemShareRecord(value: string | null) {
	if (value === null || !ITEM_SHARE_RECORD_ID_PATTERN.test(value)) {
		return null;
	}

	const recordId = Number(value);
	return Number.isSafeInteger(recordId) ? recordId : null;
}
