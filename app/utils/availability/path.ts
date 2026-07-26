import { type TDlc } from '@/data';

import type {
	IAvailabilityAcquisitionSource,
	IAvailabilityPath,
} from './types';

interface ICreateAvailabilityPathOptions {
	readonly acquisitionSources?: ReadonlyArray<IAvailabilityAcquisitionSource>;
	readonly isFishingPath?: boolean;
}

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

function getAcquisitionSourceKey(source: IAvailabilityAcquisitionSource) {
	return JSON.stringify([
		source.kind,
		source.name,
		source.place,
		source.probability,
		source.timeWindow,
	]);
}

function normalizeAcquisitionSources(
	sources: ReadonlyArray<IAvailabilityAcquisitionSource>
) {
	const sourceMap = new Map<string, IAvailabilityAcquisitionSource>();

	sources.forEach((source) => {
		sourceMap.set(getAcquisitionSourceKey(source), source);
	});

	return [...sourceMap.entries()]
		.sort(([left], [right]) => compareStrings(left, right))
		.map(([, source]) => source);
}

function getPathKey(path: IAvailabilityPath) {
	return JSON.stringify([path.requiredDlcs, path.isFishingPath]);
}

export function createAvailabilityPath(
	requiredDlcs: ReadonlyArray<TDlc>,
	source: string,
	{
		acquisitionSources = [],
		isFishingPath = false,
	}: ICreateAvailabilityPathOptions = {}
): IAvailabilityPath {
	return {
		acquisitionSources: normalizeAcquisitionSources(acquisitionSources),
		isFishingPath,
		requiredDlcs: normalizeRequiredDlcs(requiredDlcs),
		sources: [source],
	};
}

export function combineAvailabilityPaths(
	left: IAvailabilityPath,
	right: IAvailabilityPath
): IAvailabilityPath {
	return {
		acquisitionSources: normalizeAcquisitionSources([
			...left.acquisitionSources,
			...right.acquisitionSources,
		]),
		isFishingPath: left.isFishingPath || right.isFishingPath,
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
			acquisitionSources: normalizeAcquisitionSources(
				path.acquisitionSources
			),
			isFishingPath: path.isFishingPath,
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
						acquisitionSources: normalizeAcquisitionSources([
							...currentPath.acquisitionSources,
							...normalizedPath.acquisitionSources,
						]),
						isFishingPath: normalizedPath.isFishingPath,
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
