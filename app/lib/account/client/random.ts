let clientIdCounter = 0;
let fallbackInstanceSeed: string | null = null;

interface IAccountClientCrypto {
	getRandomValues?: Crypto['getRandomValues'];
	randomUUID?: Crypto['randomUUID'];
}

function createFallbackInstanceSeed() {
	const timestamp = Date.now().toString(36);
	const performanceComponent = (() => {
		const { performance } = globalThis;
		const timeOrigin = Number.isFinite(performance.timeOrigin)
			? Math.floor(performance.timeOrigin * 1000)
			: 0;
		const now = Math.floor(performance.now() * 1000);

		return `${timeOrigin.toString(36)}-${now.toString(36)}`;
	})();

	return `${timestamp}-${performanceComponent}`;
}

function getFallbackInstanceSeed() {
	fallbackInstanceSeed ??= createFallbackInstanceSeed();

	return fallbackInstanceSeed;
}

export function createAccountClientId() {
	const { crypto } = globalThis as { crypto?: IAccountClientCrypto };
	const randomUUID = crypto?.randomUUID;
	if (randomUUID !== undefined) {
		return randomUUID.call(crypto);
	}

	const getRandomValues = crypto?.getRandomValues;
	if (getRandomValues !== undefined) {
		const values = new Uint32Array(4);
		getRandomValues.call(crypto, values);

		return Array.from(values, (value) =>
			value.toString(36).padStart(7, '0')
		).join('');
	}

	clientIdCounter = (clientIdCounter + 1) % Number.MAX_SAFE_INTEGER;

	return `${Date.now().toString(36)}-${getFallbackInstanceSeed()}-${clientIdCounter.toString(36)}`;
}
