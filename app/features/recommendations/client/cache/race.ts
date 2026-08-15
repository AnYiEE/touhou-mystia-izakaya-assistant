export type TPersistentRecommendationRaceSource = 'compute' | 'persistent';

interface IPersistentRecommendationRaceParams<T> {
	readonly compute: (signal: AbortSignal) => Promise<T>;
	readonly graceMs: number;
	readonly readPersistent: () => Promise<T | undefined>;
	readonly signal?: AbortSignal;
}

interface IPersistentRecommendationRaceResult<T> {
	readonly result: T;
	readonly source: TPersistentRecommendationRaceSource;
}

type TRaceEvent<T> =
	| { readonly error: unknown; readonly kind: 'compute-error' }
	| { readonly kind: 'compute-result'; readonly result: T }
	| { readonly kind: 'grace' }
	| { readonly kind: 'persistent'; readonly result: T | undefined };

function createAbortError() {
	return new DOMException('The operation was aborted.', 'AbortError');
}

function createAbortEventPromise(signal: AbortSignal) {
	return new Promise<never>((_resolve, reject) => {
		if (signal.aborted) {
			reject(createAbortError());
			return;
		}

		signal.addEventListener(
			'abort',
			() => {
				reject(createAbortError());
			},
			{ once: true }
		);
	});
}

export async function resolvePersistentRecommendationRace<T>({
	compute,
	graceMs,
	readPersistent,
	signal,
}: IPersistentRecommendationRaceParams<T>): Promise<
	IPersistentRecommendationRaceResult<T>
> {
	if (signal?.aborted === true) {
		throw createAbortError();
	}

	const computeController = new AbortController();
	const handleParentAbort = () => {
		computeController.abort();
	};
	signal?.addEventListener('abort', handleParentAbort, { once: true });
	const abortPromise =
		signal === undefined ? null : createAbortEventPromise(signal);

	let graceTimer: ReturnType<typeof setTimeout> | undefined;
	const gracePromise = new Promise<TRaceEvent<T>>((resolve) => {
		graceTimer = setTimeout(() => {
			resolve({ kind: 'grace' });
		}, graceMs);
	});
	const persistentPromise: Promise<TRaceEvent<T>> = readPersistent().then(
		(result) => ({ kind: 'persistent', result }),
		() => ({ kind: 'persistent', result: undefined })
	);
	let computePromise: Promise<TRaceEvent<T>> | undefined;
	const startCompute = () => {
		computePromise ??= compute(computeController.signal).then(
			(result) => ({ kind: 'compute-result', result }),
			(error: unknown) => ({ error, kind: 'compute-error' })
		);
		return computePromise;
	};
	const waitFor = <TEvent>(
		promises: ReadonlyArray<Promise<TEvent>>
	): Promise<TEvent> =>
		abortPromise === null
			? Promise.race(promises)
			: Promise.race([...promises, abortPromise]);

	try {
		const firstEvent = await waitFor([persistentPromise, gracePromise]);
		if (
			firstEvent.kind === 'persistent' &&
			firstEvent.result !== undefined
		) {
			return { result: firstEvent.result, source: 'persistent' };
		}

		if (firstEvent.kind === 'persistent') {
			const computeEvent = await waitFor([startCompute()]);
			if (computeEvent.kind === 'compute-error') {
				throw computeEvent.error;
			}
			if (computeEvent.kind !== 'compute-result') {
				throw new Error('unexpected-recommendation-cache-race-event');
			}
			return { result: computeEvent.result, source: 'compute' };
		}

		const nextEvent = await waitFor([persistentPromise, startCompute()]);
		if (nextEvent.kind === 'persistent' && nextEvent.result !== undefined) {
			computeController.abort();
			return { result: nextEvent.result, source: 'persistent' };
		}
		if (nextEvent.kind === 'persistent') {
			const computeEvent = await waitFor([startCompute()]);
			if (computeEvent.kind === 'compute-error') {
				throw computeEvent.error;
			}
			if (computeEvent.kind !== 'compute-result') {
				throw new Error('unexpected-recommendation-cache-race-event');
			}
			return { result: computeEvent.result, source: 'compute' };
		}
		if (nextEvent.kind === 'compute-error') {
			const persistentEvent = await waitFor([persistentPromise]);
			if (
				persistentEvent.kind === 'persistent' &&
				persistentEvent.result !== undefined
			) {
				return { result: persistentEvent.result, source: 'persistent' };
			}
			throw nextEvent.error;
		}
		if (nextEvent.kind !== 'compute-result') {
			throw new Error('unexpected-recommendation-cache-race-event');
		}
		return { result: nextEvent.result, source: 'compute' };
	} finally {
		if (graceTimer !== undefined) {
			clearTimeout(graceTimer);
		}
		signal?.removeEventListener('abort', handleParentAbort);
	}
}
