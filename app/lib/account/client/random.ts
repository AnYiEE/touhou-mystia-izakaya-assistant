let clientIdCounter = 0;
const fallbackInstanceSeed = Math.random().toString(36).slice(2);

interface IAccountClientCrypto {
	getRandomValues?: Crypto['getRandomValues'];
	randomUUID?: Crypto['randomUUID'];
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

	return `${Date.now().toString(36)}-${fallbackInstanceSeed}-${clientIdCounter.toString(36)}`;
}
