import { createHash, timingSafeEqual } from 'node:crypto';

function createSecretDigest(secret: string) {
	return createHash('sha256').update(secret).digest();
}

export function checkSecretEqual(left: string, right: string) {
	return timingSafeEqual(createSecretDigest(left), createSecretDigest(right));
}
