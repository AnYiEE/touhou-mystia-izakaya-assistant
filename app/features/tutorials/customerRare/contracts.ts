export interface ICustomerRareTutorialProgress {
	completed: boolean;
}

export interface ICustomerRareTutorialCommands {
	complete(): void;
	reset(): void;
}
