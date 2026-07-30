export interface IAccountGateSnapshot {
	readonly isAuthenticated: boolean;
	readonly isBootstrapComplete: boolean;
	readonly isDisabled: boolean;
}

export interface IAccountGatePort {
	getSnapshot(): IAccountGateSnapshot;
	subscribe(listener: () => void): () => void;
}

export interface IRecommendationClientDependencies {
	readonly accountGate: IAccountGatePort;
}
