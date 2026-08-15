export interface ISpecialGuestTutorialProgress {
	completed: boolean;
}

export interface ISpecialGuestTutorialCommands {
	complete(): void;
	reset(): void;
}
