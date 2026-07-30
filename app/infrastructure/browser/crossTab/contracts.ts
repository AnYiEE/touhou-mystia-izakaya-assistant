export interface IRemoteStateApplicationGuard {
	checkApplyingRemoteState(): boolean;
}

export interface ICrossTabChannel<TMessage> {
	close(): void;
	post(message: TMessage): void;
	subscribe(listener: (message: TMessage) => void): () => void;
}
