interface DocumentPictureInPicture {
	readonly window: Window | null;
	requestWindow(options?: {
		disallowReturnToOpener?: boolean;
		height?: number | undefined;
		preferInitialWindowPlacement?: boolean;
		width?: number | undefined;
	}): Promise<Window>;
}

declare global {
	// eslint-disable-next-line vars-on-top
	var documentPictureInPicture: DocumentPictureInPicture | undefined;
}

// eslint-disable-next-line unicorn/require-module-specifiers
export {};
