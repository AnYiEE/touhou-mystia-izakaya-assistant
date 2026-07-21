import {
	type TIngredientName,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';

const DEFAULT_SLICE_BUDGET_MS = 6;

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
	readonly tags: ReadonlyArray<TIngredientTag>;
}

export interface IExactIngredientState {
	readonly count: number;
	readonly effectMask: ReadonlyArray<number>;
	readonly extraIngredients: ReadonlyArray<TIngredientName>;
	readonly ingredientPenalty: number;
	readonly orderedTagIndexes: ReadonlyArray<number>;
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
	const resetSliceStartedAt = () => {
		sliceStartedAt = now();
	};

	function checkpoint(force: true): Promise<void>;
	function checkpoint(force?: false): Promise<void> | undefined;
	function checkpoint(force = false) {
		throwIfAborted(signal);

		try {
			if (!force && now() - sliceStartedAt < sliceBudgetMs) {
				return;
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
	const nextMask = [...mask];

	for (const index of indexes) {
		const segmentIndex = Math.floor(index / 32);
		const bitIndex = index % 32;
		nextMask[segmentIndex] =
			((nextMask[segmentIndex] ?? 0) | (1 << bitIndex)) >>> 0;
	}

	return nextMask;
}

function createStateKey({
	effectMask,
	orderedTagIndexes,
	tagMask,
}: Pick<
	IExactIngredientState,
	'effectMask' | 'orderedTagIndexes' | 'tagMask'
>) {
	return `${tagMask.join('.')}:${effectMask.join('.')}:${orderedTagIndexes.join('.')}`;
}

function appendOrderedTagIndexes(
	currentIndexes: ReadonlyArray<number>,
	candidateTags: ReadonlyArray<TIngredientTag>,
	tagIndexMap: ReadonlyMap<TIngredientTag, number>,
	orderSensitiveTags: ReadonlySet<TRecipeTag>
) {
	const nextIndexes = [...currentIndexes];
	const seen = new Set(currentIndexes);

	for (const tag of candidateTags) {
		const index = tagIndexMap.get(tag);
		if (
			index !== undefined &&
			orderSensitiveTags.has(tag as TRecipeTag) &&
			!seen.has(index)
		) {
			seen.add(index);
			nextIndexes.push(index);
		}
	}

	return nextIndexes;
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
		tagMask: createEmptyMask(tagNames.length),
	};
	const layerMaps = Array.from(
		{ length: maxCount + 1 },
		() => new Map<string, IExactIngredientState>()
	);
	layerMaps[0]?.set(createStateKey(emptyState), emptyState);

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
		const maxTargetCount = Math.min(maxCount, candidateIndex + 1);

		for (let count = maxTargetCount; count >= 1; count--) {
			const sourceLayer = layerMaps[count - 1];
			const targetLayer = layerMaps[count];
			if (sourceLayer === undefined || targetLayer === undefined) {
				continue;
			}

			for (const sourceState of sourceLayer.values()) {
				const checkpoint = execution.checkpoint();
				if (checkpoint !== undefined) {
					await checkpoint;
				}
				const nextState: IExactIngredientState = {
					count,
					effectMask: addMaskIndexes(
						sourceState.effectMask,
						candidateEffectIndexes
					),
					extraIngredients: [
						...sourceState.extraIngredients,
						candidate.name,
					],
					ingredientPenalty:
						sourceState.ingredientPenalty + candidate.penalty,
					orderedTagIndexes: appendOrderedTagIndexes(
						sourceState.orderedTagIndexes,
						candidate.tags,
						tagIndexMap,
						orderSensitiveTags
					),
					tagMask: addMaskIndexes(
						sourceState.tagMask,
						candidateTagIndexes
					),
				};
				const stateKey = createStateKey(nextState);
				const currentState = targetLayer.get(stateKey);

				if (
					currentState === undefined ||
					nextState.ingredientPenalty < currentState.ingredientPenalty
				) {
					targetLayer.set(stateKey, nextState);
				}
			}
		}
	}

	const layers: IExactIngredientState[][] = [];
	let stateCount = 0;
	for (const layer of layerMaps) {
		const states: IExactIngredientState[] = [];
		for (const state of layer.values()) {
			const checkpoint = execution.checkpoint();
			if (checkpoint !== undefined) {
				await checkpoint;
			}
			states.push(state);
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
