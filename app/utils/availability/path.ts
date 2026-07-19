import { type TDlc } from '@/data';

import type { IAvailabilityPath } from './types';

function compareStrings(left: string, right: string) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function normalizeRequiredDlcs(
	requiredDlcs: ReadonlyArray<TDlc>
): IAvailabilityPath['requiredDlcs'] {
	if (requiredDlcs.length === 0) {
		throw new Error('可获取路径至少需要一个DLC');
	}

	const normalizedDlcs = [...new Set(requiredDlcs)];
	const hasOptionalDlc = normalizedDlcs.some((dlc) => dlc !== 0);
	const [firstDlc, ...remainingDlcs] = normalizedDlcs
		.filter((dlc) => !hasOptionalDlc || dlc !== 0)
		.sort((left, right) => left - right);

	if (firstDlc === undefined) {
		throw new Error('可获取路径至少需要一个DLC');
	}

	return [firstDlc, ...remainingDlcs];
}

function normalizeSources(sources: ReadonlyArray<string>) {
	return [...new Set(sources)].sort(compareStrings);
}

function getPathKey(path: IAvailabilityPath) {
	return JSON.stringify(path.requiredDlcs);
}

export function createAvailabilityPath(
	requiredDlcs: ReadonlyArray<TDlc>,
	source: string
): IAvailabilityPath {
	return {
		requiredDlcs: normalizeRequiredDlcs(requiredDlcs),
		sources: [source],
	};
}

export function combineAvailabilityPaths(
	left: IAvailabilityPath,
	right: IAvailabilityPath
): IAvailabilityPath {
	return {
		requiredDlcs: normalizeRequiredDlcs([
			...left.requiredDlcs,
			...right.requiredDlcs,
		]),
		sources: normalizeSources([...left.sources, ...right.sources]),
	};
}

export function normalizeAvailabilityPaths(
	paths: ReadonlyArray<IAvailabilityPath>
) {
	const pathMap = new Map<string, IAvailabilityPath>();

	paths.forEach((path) => {
		const normalizedPath: IAvailabilityPath = {
			requiredDlcs: normalizeRequiredDlcs(path.requiredDlcs),
			sources: normalizeSources(path.sources),
		};
		const key = getPathKey(normalizedPath);
		const currentPath = pathMap.get(key);

		pathMap.set(
			key,
			currentPath === undefined
				? normalizedPath
				: {
						requiredDlcs: normalizedPath.requiredDlcs,
						sources: normalizeSources([
							...currentPath.sources,
							...normalizedPath.sources,
						]),
					}
		);
	});

	return [...pathMap.values()].sort((left, right) =>
		compareStrings(getPathKey(left), getPathKey(right))
	);
}
