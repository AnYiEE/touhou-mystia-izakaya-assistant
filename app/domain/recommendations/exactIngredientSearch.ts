import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TFoodTagId } from '@/domain/data/tags/types';

import type { ISuggestMealsExecution } from './execution';
import {
	EMPTY_RECOMMENDATION_PRIORITY_METRICS,
	type IRecommendationPriorityMetrics,
	compareRecommendationStrictMetrics,
} from './priority';

export interface IExactIngredientCandidate {
	readonly effectKeys: ReadonlyArray<string>;
	readonly id: TIngredientId;
	readonly penalty: number;
	readonly priority: IRecommendationPriorityMetrics;
	readonly tags: ReadonlyArray<TFoodTagId>;
}

export interface IExactIngredientState {
	readonly count: number;
	readonly effectMask: ReadonlyArray<number>;
	readonly extraIngredients: ReadonlyArray<TIngredientId>;
	readonly ingredientPenalty: number;
	readonly orderedTagIndexes: ReadonlyArray<number>;
	readonly priority: IRecommendationPriorityMetrics;
	readonly tagMask: ReadonlyArray<number>;
}

export interface IExactIngredientStateTable {
	readonly effectKeys: ReadonlyArray<string>;
	readonly layers: ReadonlyArray<ReadonlyArray<IExactIngredientState>>;
	readonly stateCount: number;
	readonly tags: ReadonlyArray<TFoodTagId>;
}

interface IBuildExactIngredientStateTableParams {
	readonly candidates: ReadonlyArray<IExactIngredientCandidate>;
	readonly maxCount: number;
	readonly orderSensitiveTags?: ReadonlySet<TFoodTagId>;
}

function buildIndex<T extends PropertyKey>(
	values: ReadonlyArray<ReadonlyArray<T>>
) {
	const names: T[] = [];
	const indexMap = new Map<T, number>();

	for (const group of values) {
		for (const value of group) {
			if (!indexMap.has(value)) {
				indexMap.set(value, names.length);
				names.push(value);
			}
		}
	}

	return { indexMap, names };
}

function createEmptyMask(length: number) {
	return Array.from({ length: Math.ceil(length / 32) }, () => 0);
}

function addMaskIndexes(
	mask: ReadonlyArray<number>,
	indexes: ReadonlyArray<number>
) {
	let nextMask: number[] | undefined;

	for (const index of indexes) {
		const segmentIndex = Math.floor(index / 32);
		const bitIndex = index % 32;
		const segment = (nextMask ?? mask)[segmentIndex] ?? 0;
		const nextSegment = (segment | (1 << bitIndex)) >>> 0;
		if (nextSegment === segment) {
			continue;
		}

		nextMask ??= [...mask];
		nextMask[segmentIndex] = nextSegment;
	}

	return nextMask ?? mask;
}

function mergeMasks(
	mask: ReadonlyArray<number>,
	addition: ReadonlyArray<number>
) {
	let nextMask: number[] | undefined;

	for (const [segmentIndex, additionSegment] of addition.entries()) {
		const segment = (nextMask ?? mask)[segmentIndex] ?? 0;
		const nextSegment = (segment | additionSegment) >>> 0;
		if (nextSegment === segment) {
			continue;
		}

		nextMask ??= [...mask];
		nextMask[segmentIndex] = nextSegment;
	}

	return nextMask ?? mask;
}

function createStateKey(
	tagMask: ReadonlyArray<number>,
	effectMask: ReadonlyArray<number>,
	orderedTagIndexes: ReadonlyArray<number>
) {
	const tagKey =
		tagMask.length === 1
			? (tagMask[0]?.toString() ?? '')
			: tagMask.join('.');
	const effectKey =
		effectMask.length === 1
			? (effectMask[0]?.toString() ?? '')
			: effectMask.join('.');
	const orderedTagKey =
		orderedTagIndexes.length === 0 ? '' : orderedTagIndexes.join('.');

	return `${tagKey}:${effectKey}:${orderedTagKey}`;
}

function compareTerminalStates(
	left: IExactIngredientState,
	right: IExactIngredientState
) {
	return (
		compareRecommendationStrictMetrics(left.priority, right.priority) ||
		left.ingredientPenalty - right.ingredientPenalty
	);
}

function appendOrderedTagIndexes(
	currentIndexes: ReadonlyArray<number>,
	candidateTags: ReadonlyArray<TFoodTagId>,
	tagIndexMap: ReadonlyMap<TFoodTagId, number>,
	orderSensitiveTags: ReadonlySet<TFoodTagId>
) {
	if (orderSensitiveTags.size === 0) {
		return currentIndexes;
	}

	let nextIndexes: number[] | undefined;

	for (const tag of candidateTags) {
		const index = tagIndexMap.get(tag);
		if (
			index !== undefined &&
			orderSensitiveTags.has(tag) &&
			!(nextIndexes ?? currentIndexes).includes(index)
		) {
			nextIndexes ??= [...currentIndexes];
			nextIndexes.push(index);
		}
	}

	return nextIndexes ?? currentIndexes;
}

export async function buildExactIngredientStateTable(
	{
		candidates,
		maxCount,
		orderSensitiveTags = new Set<TFoodTagId>(),
	}: IBuildExactIngredientStateTableParams,
	execution: ISuggestMealsExecution
): Promise<IExactIngredientStateTable> {
	if (!Number.isInteger(maxCount) || maxCount < 0) {
		throw new RangeError(
			'maxCount must be an integer greater than or equal to 0.'
		);
	}

	execution.throwIfAborted();

	const { indexMap: tagIndexMap, names: tags } = buildIndex(
		candidates.map(({ tags: candidateTags }) => candidateTags)
	);
	const { indexMap: effectIndexMap, names: effectKeys } = buildIndex(
		candidates.map(
			({ effectKeys: candidateEffectKeys }) => candidateEffectKeys
		)
	);
	const emptyState: IExactIngredientState = {
		count: 0,
		effectMask: createEmptyMask(effectKeys.length),
		extraIngredients: [],
		ingredientPenalty: 0,
		orderedTagIndexes: [],
		priority: EMPTY_RECOMMENDATION_PRIORITY_METRICS,
		tagMask: createEmptyMask(tags.length),
	};
	const layerMaps = Array.from(
		{ length: maxCount + 1 },
		() => new Map<string, IExactIngredientState[]>()
	);
	layerMaps[0]?.set(
		createStateKey(
			emptyState.tagMask,
			emptyState.effectMask,
			emptyState.orderedTagIndexes
		),
		[emptyState]
	);

	for (const [candidateIndex, candidate] of candidates.entries()) {
		execution.throwIfAborted();
		const candidateTagIndexes = candidate.tags.flatMap((tag) => {
			const index = tagIndexMap.get(tag);
			return index === undefined ? [] : [index];
		});
		const candidateEffectIndexes = candidate.effectKeys.flatMap((key) => {
			const index = effectIndexMap.get(key);
			return index === undefined ? [] : [index];
		});
		const candidateTagMask = addMaskIndexes(
			emptyState.tagMask,
			candidateTagIndexes
		);
		const candidateEffectMask = addMaskIndexes(
			emptyState.effectMask,
			candidateEffectIndexes
		);
		const maxTargetCount = Math.min(maxCount, candidateIndex + 1);

		for (let count = maxTargetCount; count >= 1; count--) {
			const sourceLayer = layerMaps[count - 1];
			const targetLayer = layerMaps[count];
			if (sourceLayer === undefined || targetLayer === undefined) {
				continue;
			}

			for (const sourceStates of sourceLayer.values()) {
				for (const sourceState of sourceStates) {
					const checkpoint = execution.checkpoint();
					if (checkpoint !== undefined) {
						await checkpoint;
					}
					const effectMask = mergeMasks(
						sourceState.effectMask,
						candidateEffectMask
					);
					const ingredientPenalty =
						sourceState.ingredientPenalty + candidate.penalty;
					const acquisitionEase =
						sourceState.priority.acquisitionEase +
						candidate.priority.acquisitionEase;
					const contentMismatchCount =
						sourceState.priority.contentMismatchCount +
						candidate.priority.contentMismatchCount;
					const guestPlacesMismatchCount =
						sourceState.priority.guestPlacesMismatchCount +
						candidate.priority.guestPlacesMismatchCount;
					const lateSourceCount =
						sourceState.priority.lateSourceCount +
						candidate.priority.lateSourceCount;
					const maxLateTierDistance = Math.max(
						sourceState.priority.maxLateTierDistance,
						candidate.priority.maxLateTierDistance
					);
					const pathMismatchCount =
						sourceState.priority.pathMismatchCount +
						candidate.priority.pathMismatchCount;
					const primaryPlaceMismatchCount =
						sourceState.priority.primaryPlaceMismatchCount +
						candidate.priority.primaryPlaceMismatchCount;
					const totalLateTierDistance =
						sourceState.priority.totalLateTierDistance +
						candidate.priority.totalLateTierDistance;
					const unknownSourceCount =
						sourceState.priority.unknownSourceCount +
						candidate.priority.unknownSourceCount;
					const orderedTagIndexes = appendOrderedTagIndexes(
						sourceState.orderedTagIndexes,
						candidate.tags,
						tagIndexMap,
						orderSensitiveTags
					);
					const tagMask = mergeMasks(
						sourceState.tagMask,
						candidateTagMask
					);
					const stateKey = createStateKey(
						tagMask,
						effectMask,
						orderedTagIndexes
					);
					const currentStates = targetLayer.get(stateKey);
					let isDominated = false;
					if (currentStates !== undefined) {
						for (const state of currentStates) {
							if (
								state.priority.contentMismatchCount <=
									contentMismatchCount &&
								state.priority.pathMismatchCount <=
									pathMismatchCount &&
								state.priority.primaryPlaceMismatchCount <=
									primaryPlaceMismatchCount &&
								state.priority.guestPlacesMismatchCount <=
									guestPlacesMismatchCount &&
								state.priority.unknownSourceCount <=
									unknownSourceCount &&
								state.priority.lateSourceCount <=
									lateSourceCount &&
								state.priority.maxLateTierDistance <=
									maxLateTierDistance &&
								state.priority.totalLateTierDistance <=
									totalLateTierDistance &&
								state.priority.acquisitionEase >=
									acquisitionEase &&
								state.ingredientPenalty <= ingredientPenalty
							) {
								isDominated = true;
								break;
							}
						}
					}
					if (isDominated) {
						continue;
					}

					const priority: IRecommendationPriorityMetrics = {
						acquisitionEase,
						contentMismatchCount,
						guestPlacesMismatchCount,
						lateSourceCount,
						maxLateTierDistance,
						pathMismatchCount,
						primaryPlaceMismatchCount,
						totalLateTierDistance,
						unknownSourceCount,
					};
					const nextState: IExactIngredientState = {
						count,
						effectMask,
						extraIngredients: [
							...sourceState.extraIngredients,
							candidate.id,
						],
						ingredientPenalty,
						orderedTagIndexes,
						priority,
						tagMask,
					};
					if (currentStates === undefined) {
						targetLayer.set(stateKey, [nextState]);
						continue;
					}

					let writeIndex = 0;
					for (const state of currentStates) {
						if (
							contentMismatchCount >
								state.priority.contentMismatchCount ||
							pathMismatchCount >
								state.priority.pathMismatchCount ||
							primaryPlaceMismatchCount >
								state.priority.primaryPlaceMismatchCount ||
							guestPlacesMismatchCount >
								state.priority.guestPlacesMismatchCount ||
							unknownSourceCount >
								state.priority.unknownSourceCount ||
							lateSourceCount > state.priority.lateSourceCount ||
							maxLateTierDistance >
								state.priority.maxLateTierDistance ||
							totalLateTierDistance >
								state.priority.totalLateTierDistance ||
							acquisitionEase < state.priority.acquisitionEase ||
							ingredientPenalty > state.ingredientPenalty
						) {
							currentStates[writeIndex++] = state;
						}
					}
					currentStates.length = writeIndex;
					currentStates.push(nextState);
				}
			}
		}
	}

	const layers: IExactIngredientState[][] = [];
	let stateCount = 0;
	for (const layer of layerMaps) {
		const states: IExactIngredientState[] = [];
		for (const stateGroup of layer.values()) {
			let [terminalState] = stateGroup;
			for (const state of stateGroup) {
				const checkpoint = execution.checkpoint();
				if (checkpoint !== undefined) {
					await checkpoint;
				}
				if (
					terminalState === undefined ||
					compareTerminalStates(state, terminalState) < 0
				) {
					terminalState = state;
				}
			}
			if (terminalState !== undefined) {
				states.push(terminalState);
			}
		}
		stateCount += states.length;
		layers.push(states);
	}
	execution.throwIfAborted();

	return { effectKeys, layers, stateCount, tags };
}

function hasMaskIndex(mask: ReadonlyArray<number>, index: number) {
	const segment = mask[Math.floor(index / 32)] ?? 0;

	return (segment & (1 << (index % 32))) !== 0;
}

export function getExactIngredientStateTags(
	table: Pick<IExactIngredientStateTable, 'tags'>,
	state:
		| Pick<IExactIngredientState, 'orderedTagIndexes' | 'tagMask'>
		| undefined
) {
	if (state === undefined) {
		return [];
	}

	const orderedIndexes = new Set(state.orderedTagIndexes);
	const orderedTags = state.orderedTagIndexes.flatMap((index) => {
		const tag = table.tags[index];
		return tag === undefined ? [] : [tag];
	});
	const remainingTags = table.tags.filter(
		(_tag, index) =>
			!orderedIndexes.has(index) && hasMaskIndex(state.tagMask, index)
	);

	return [...orderedTags, ...remainingTags];
}
