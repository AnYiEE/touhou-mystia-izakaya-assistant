import { type TDlc } from '@/data';

import type { IAvailabilityPath } from './types';

function compareDlcRequirementPaths(left: TDlc[], right: TDlc[]) {
	if (left.length !== right.length) {
		return left.length - right.length;
	}

	for (const [index, leftDlc] of left.entries()) {
		const difference = leftDlc - (right[index] as number);
		if (difference !== 0) {
			return difference;
		}
	}

	return 0;
}

function normalizeDlcRequirementPaths(
	paths: ReadonlyArray<ReadonlyArray<TDlc>>
) {
	const pathMap = new Map<string, TDlc[]>();

	paths.forEach((path) => {
		const normalizedPath = [...new Set(path)].sort(
			(left, right) => left - right
		);
		pathMap.set(JSON.stringify(normalizedPath), normalizedPath);
	});

	const normalizedPaths = [...pathMap.values()].sort(
		compareDlcRequirementPaths
	);

	return normalizedPaths.filter(
		(path) =>
			!normalizedPaths.some(
				(otherPath) =>
					otherPath.length < path.length &&
					otherPath.every((dlc) => path.includes(dlc))
			)
	);
}

export function getMissingDlcRequirementPaths(
	itemAvailabilityPaths: ReadonlyArray<ReadonlyArray<IAvailabilityPath>>,
	hiddenDlcs: ReadonlySet<TDlc>
) {
	let combinedPaths: TDlc[][] = [[]];

	itemAvailabilityPaths.forEach((availabilityPaths) => {
		const missingPaths = normalizeDlcRequirementPaths(
			availabilityPaths.map(({ requiredDlcs }) =>
				requiredDlcs.filter((dlc) => dlc !== 0 && hiddenDlcs.has(dlc))
			)
		);

		combinedPaths = normalizeDlcRequirementPaths(
			combinedPaths.flatMap((combinedPath) =>
				missingPaths.map((missingPath) => [
					...combinedPath,
					...missingPath,
				])
			)
		);
	});

	return combinedPaths.length === 1 && combinedPaths[0]?.length === 0
		? []
		: combinedPaths;
}
