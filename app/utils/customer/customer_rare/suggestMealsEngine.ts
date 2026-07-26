import {
	type TIngredientName,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';

import {
	EMPTY_RECOMMENDATION_PRIORITY_METRICS,
	type IRecommendationPriorityMetrics,
	compareRecommendationStrictMetrics,
} from './suggestMealPriority';

const DEFAULT_SLICE_BUDGET_MS = 6;
const CHECKPOINT_TIME_CHECK_INTERVAL = 32;

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

export interface ISuggestMealsYieldScheduler {
	yield(taskKey: string, signal?: AbortSignal): Promise<void>;
}

export interface ISuggestMealsExecution {
	checkpoint(force: true): Promise<void>;
	checkpoint(force?: false): Promise<void> | undefined;
	throwIfAborted(): void;
}

export interface IExactIngredientCandidate {
	readonly effectKeys: ReadonlyArray<string>;
	readonly name: TIngredientName;
	readonly penalty: number;
	readonly priority: IRecommendationPriorityMetrics;
	readonly tags: ReadonlyArray<TIngredientTag>;
}

export interface IExactIngredientState {
	readonly count: number;
	readonly effectMask: ReadonlyArray<number>;
	readonly extraIngredients: ReadonlyArray<TIngredientName>;
	readonly ingredientPenalty: number;
	readonly orderedTagIndexes: ReadonlyArray<number>;
	readonly priority: IRecommendationPriorityMetrics;
	readonly tagMask: ReadonlyArray<number>;
}

export interface IExactIngredientStateTable {
	readonly effectKeys: ReadonlyArray<string>;
	readonly layers: ReadonlyArray<ReadonlyArray<IExactIngredientState>>;
	readonly stateCount: number;
	readonly tagNames: ReadonlyArray<TIngredientTag>;
}

interface IBuildExactIngredientStateTableParams {
	readonly candidates: ReadonlyArray<IExactIngredientCandidate>;
	readonly maxCount: number;
	readonly orderSensitiveTags?: ReadonlySet<TRecipeTag>;
}

interface IYieldTicket {
	readonly reject: (error: Error) => void;
	readonly resolve: () => void;
	readonly signal?: AbortSignal;
	readonly taskKey: string;
	abortHandler?: () => void;
}

function createAbortError() {
	const error = new Error('The recommendation task was aborted.');
	error.name = 'AbortError';

	return error;
}

export function checkSuggestMealsAbortError(error: unknown) {
	return error instanceof Error && error.name === 'AbortError';
}

function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) {
		throw createAbortError();
	}
}

function getNow() {
	return globalThis.performance.now();
}

function createHostTaskScheduler() {
	if (!isServer && typeof globalThis.MessageChannel === 'function') {
		const channel = new globalThis.MessageChannel();
		const tasks: Array<() => void> = [];
		channel.port1.addEventListener('message', () => {
			tasks.shift()?.();
		});
		channel.port1.start();

		return (callback: () => void) => {
			let isCancelled = false;
			tasks.push(() => {
				if (!isCancelled) {
					callback();
				}
			});
			channel.port2.postMessage(null);

			return () => {
				isCancelled = true;
			};
		};
	}

	return (callback: () => void) => {
		const timeout = globalThis.setTimeout(callback, 0);

		return () => {
			globalThis.clearTimeout(timeout);
		};
	};
}

const scheduleHostTask = createHostTaskScheduler();

const defaultYieldScheduler: ISuggestMealsYieldScheduler = {
	yield(_taskKey, signal) {
		throwIfAborted(signal);

		return new Promise<void>((resolve, reject) => {
			let abortHandler: (() => void) | undefined;
			const cancelHostTask = scheduleHostTask(() => {
				if (abortHandler !== undefined) {
					signal?.removeEventListener('abort', abortHandler);
				}

				try {
					throwIfAborted(signal);
					resolve();
				} catch (error) {
					reject(
						error instanceof Error
							? error
							: new Error('Recommendation scheduling failed.')
					);
				}
			});

			if (signal !== undefined) {
				abortHandler = () => {
					cancelHostTask();
					if (abortHandler !== undefined) {
						signal.removeEventListener('abort', abortHandler);
					}
					reject(createAbortError());
				};
				signal.addEventListener('abort', abortHandler, { once: true });
			}
		});
	},
};

export function createRoundRobinSuggestMealsScheduler(): ISuggestMealsYieldScheduler {
	const taskOrder: string[] = [];
	const taskQueues = new Map<string, IYieldTicket[]>();
	let isScheduled = false;

	const removeTask = (taskKey: string) => {
		taskQueues.delete(taskKey);
		const taskIndex = taskOrder.indexOf(taskKey);
		if (taskIndex !== -1) {
			taskOrder.splice(taskIndex, 1);
		}
	};

	const scheduleNext = () => {
		if (isScheduled || taskOrder.length === 0) {
			return;
		}

		isScheduled = true;
		scheduleHostTask(() => {
			isScheduled = false;

			while (taskOrder.length > 0) {
				const taskKey = taskOrder.shift();
				if (taskKey === undefined) {
					break;
				}

				const taskQueue = taskQueues.get(taskKey);
				const ticket = taskQueue?.shift();
				if (taskQueue === undefined || ticket === undefined) {
					taskQueues.delete(taskKey);
					continue;
				}

				if (taskQueue.length === 0) {
					taskQueues.delete(taskKey);
				} else {
					taskOrder.push(taskKey);
				}

				if (ticket.abortHandler !== undefined) {
					ticket.signal?.removeEventListener(
						'abort',
						ticket.abortHandler
					);
				}

				if (ticket.signal?.aborted) {
					ticket.reject(createAbortError());
					continue;
				}

				ticket.resolve();
				break;
			}

			scheduleNext();
		});
	};

	return {
		yield(taskKey, signal) {
			throwIfAborted(signal);

			return new Promise<void>((resolve, reject) => {
				const ticket: IYieldTicket = {
					reject,
					resolve,
					...(signal === undefined ? {} : { signal }),
					taskKey,
				};

				if (signal !== undefined) {
					ticket.abortHandler = () => {
						const taskQueue = taskQueues.get(taskKey);
						const ticketIndex = taskQueue?.indexOf(ticket) ?? -1;
						if (taskQueue !== undefined && ticketIndex !== -1) {
							taskQueue.splice(ticketIndex, 1);
							if (taskQueue.length === 0) {
								removeTask(taskKey);
							}
						}
						signal.removeEventListener(
							'abort',
							ticket.abortHandler as () => void
						);
						reject(createAbortError());
						scheduleNext();
					};
					signal.addEventListener('abort', ticket.abortHandler, {
						once: true,
					});
				}

				const taskQueue = taskQueues.get(taskKey);
				if (taskQueue === undefined) {
					taskQueues.set(taskKey, [ticket]);
					taskOrder.push(taskKey);
				} else {
					taskQueue.push(ticket);
				}
				scheduleNext();
			});
		},
	};
}

export function createSuggestMealsExecution({
	now = getNow,
	scheduler = defaultYieldScheduler,
	signal,
	sliceBudgetMs = DEFAULT_SLICE_BUDGET_MS,
	taskKey = 'suggest-meals',
}: {
	now?: () => number;
	scheduler?: ISuggestMealsYieldScheduler;
	signal?: AbortSignal;
	sliceBudgetMs?: number;
	taskKey?: string;
} = {}): ISuggestMealsExecution {
	if (Number.isNaN(sliceBudgetMs) || sliceBudgetMs < 0) {
		throw new RangeError('sliceBudgetMs must be a non-negative number.');
	}

	let sliceStartedAt = now();
	let checkpointsUntilTimeCheck = CHECKPOINT_TIME_CHECK_INTERVAL;
	const resetSliceStartedAt = () => {
		sliceStartedAt = now();
		checkpointsUntilTimeCheck = CHECKPOINT_TIME_CHECK_INTERVAL;
	};

	function checkpoint(force: true): Promise<void>;
	function checkpoint(force?: false): Promise<void> | undefined;
	function checkpoint(force = false) {
		throwIfAborted(signal);

		try {
			if (!force) {
				if (sliceBudgetMs === Infinity) {
					return;
				}
				if (sliceBudgetMs > 0) {
					checkpointsUntilTimeCheck--;
					if (checkpointsUntilTimeCheck > 0) {
						return;
					}
					checkpointsUntilTimeCheck = CHECKPOINT_TIME_CHECK_INTERVAL;
				}
				if (now() - sliceStartedAt < sliceBudgetMs) {
					return;
				}
			}

			return scheduler.yield(taskKey, signal).then(() => {
				throwIfAborted(signal);
				resetSliceStartedAt();
			});
		} catch (error) {
			// Preserve the rejection value produced by the former async checkpoint.
			// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
			return Promise.reject(error);
		}
	}

	return {
		checkpoint,
		throwIfAborted() {
			throwIfAborted(signal);
		},
	};
}

function buildIndex<T extends string>(values: ReadonlyArray<ReadonlyArray<T>>) {
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
	candidateTags: ReadonlyArray<TIngredientTag>,
	tagIndexMap: ReadonlyMap<TIngredientTag, number>,
	orderSensitiveTags: ReadonlySet<TRecipeTag>
) {
	if (orderSensitiveTags.size === 0) {
		return currentIndexes;
	}

	let nextIndexes: number[] | undefined;

	for (const tag of candidateTags) {
		const index = tagIndexMap.get(tag);
		if (
			index !== undefined &&
			orderSensitiveTags.has(tag as TRecipeTag) &&
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
		orderSensitiveTags = new Set<TRecipeTag>(),
	}: IBuildExactIngredientStateTableParams,
	execution: ISuggestMealsExecution
): Promise<IExactIngredientStateTable> {
	if (!Number.isInteger(maxCount) || maxCount < 0) {
		throw new RangeError(
			'maxCount must be an integer greater than or equal to 0.'
		);
	}

	execution.throwIfAborted();

	const { indexMap: tagIndexMap, names: tagNames } = buildIndex(
		candidates.map(({ tags }) => tags)
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
		tagMask: createEmptyMask(tagNames.length),
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
					const customerPlacesMismatchCount =
						sourceState.priority.customerPlacesMismatchCount +
						candidate.priority.customerPlacesMismatchCount;
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
								state.priority.customerPlacesMismatchCount <=
									customerPlacesMismatchCount &&
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
						customerPlacesMismatchCount,
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
							candidate.name,
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
							customerPlacesMismatchCount >
								state.priority.customerPlacesMismatchCount ||
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

	return { effectKeys, layers, stateCount, tagNames };
}

function hasMaskIndex(mask: ReadonlyArray<number>, index: number) {
	const segment = mask[Math.floor(index / 32)] ?? 0;

	return (segment & (1 << (index % 32))) !== 0;
}

export function getExactIngredientStateTags(
	table: Pick<IExactIngredientStateTable, 'tagNames'>,
	state:
		| Pick<IExactIngredientState, 'orderedTagIndexes' | 'tagMask'>
		| undefined
) {
	if (state === undefined) {
		return [];
	}

	const orderedIndexes = new Set(state.orderedTagIndexes);
	const orderedTags = state.orderedTagIndexes.flatMap((index) => {
		const tag = table.tagNames[index];
		return tag === undefined ? [] : [tag];
	});
	const remainingTags = table.tagNames.filter(
		(_tag, index) =>
			!orderedIndexes.has(index) && hasMaskIndex(state.tagMask, index)
	);

	return [...orderedTags, ...remainingTags];
}
