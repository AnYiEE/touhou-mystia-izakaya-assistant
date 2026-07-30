import type {
	ISuggestMealsExecution,
	ISuggestMealsYieldScheduler,
} from '@/domain/recommendations/execution';

const DEFAULT_SLICE_BUDGET_MS = 6;
const CHECKPOINT_TIME_CHECK_INTERVAL = 32;

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

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
