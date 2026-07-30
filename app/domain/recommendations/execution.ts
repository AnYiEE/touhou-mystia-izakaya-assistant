export interface ISuggestMealsYieldScheduler {
	yield(taskKey: string, signal?: AbortSignal): Promise<void>;
}

export interface ISuggestMealsExecution {
	checkpoint(force: true): Promise<void>;
	checkpoint(force?: false): Promise<void> | undefined;
	throwIfAborted(): void;
}
