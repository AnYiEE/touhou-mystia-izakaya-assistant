import { NextResponse } from 'next/server';

import { type TBeverageTag } from '@/data';
import { getSearchResult } from '@/hooks/useSearchResult';
import { copyArray, pinyinSort } from '@/utilities';
import { Beverage } from '@/utils';
import type { TItemInstance } from '@/utils/types';
import type { IApiErrorResponse, IApiSuccessResponse } from './types';

export function createJsonResponse<T>(data: T, status = 200) {
	return NextResponse.json(
		{ data, status: 'ok' } satisfies IApiSuccessResponse<T>,
		{ status }
	);
}

export function createErrorResponse(message: string, status: number) {
	return NextResponse.json(
		{ message, status: 'error' } satisfies IApiErrorResponse,
		{ status }
	);
}

export function handleOptionsRequest() {
	return new NextResponse(null, { status: 204 });
}

export function parseCommaSeparatedParam(value: string | null) {
	if (value === null || value === '') {
		return null;
	}
	return value.split(',').map((v) => v.trim());
}

export function parseBooleanParam(value: string | null) {
	return value === 'true';
}

export function getByNameOrNotFound(
	instance: TItemInstance,
	name: string
): { data: Record<string, unknown> | null; error: string | null } {
	try {
		const item = (
			instance as unknown as { getPropsByName: (name: string) => unknown }
		).getPropsByName(name);
		return { data: item as Record<string, unknown>, error: null };
	} catch {
		return { data: null, error: `${name} not found` };
	}
}

export function applySortParam(
	data: ReadonlyArray<unknown>,
	instance: {
		getPinyinSortedData: (data: never) => {
			get: () => ReadonlyArray<unknown>;
			fork: () => unknown[] | ReadonlyArray<unknown>;
		};
	},
	sort: string | null
): ReadonlyArray<unknown> {
	if (sort === 'az') {
		return instance.getPinyinSortedData(data as never).get();
	}
	if (sort === 'za') {
		return [
			...instance.getPinyinSortedData(data as never).fork(),
		].reverse();
	}
	return data;
}

export function applyNameSearch<T extends { name: string; pinyin: string[] }>(
	data: ReadonlyArray<T>,
	name: string | null
): ReadonlyArray<T> {
	if (name === null || name === '') {
		return data;
	}
	return data.filter((item) => getSearchResult(name, item));
}

export function sortTagsByPinyin<T extends string>(tags: T[]): T[] {
	return copyArray(tags).sort(pinyinSort);
}

export function sortBeverageTags(tags: TBeverageTag[]): TBeverageTag[] {
	const sortedOrder = Beverage.getInstance().sortedTags;
	return copyArray(tags).sort(
		(a, b) => sortedOrder.indexOf(a) - sortedOrder.indexOf(b)
	);
}
