declare global {
	interface PublicKeyCredentialConstructor {
		signalCurrentUserDetails?: (options: {
			displayName: string;
			name: string;
			rpId: string;
			userId: string;
		}) => Promise<void>;
	}
}

export {};
