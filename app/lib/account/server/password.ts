import { hash, verify } from '@node-rs/argon2';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const ARGON2_OPTIONS = {
	memoryCost: 19456,
	outputLen: 32,
	parallelism: 1,
	timeCost: 2,
} as const;

const DUMMY_PASSWORD_HASH =
	'$argon2id$v=19$m=19456,t=2,p=1$6KmvqCVltIc8Fl1NcSZWJA$T+3fu6nQ45w3+SZzjQI5aWIN42dw9pU8K//r1DoiuOg';

export class PasswordPolicyError extends Error {
	constructor() {
		super('invalid-password-rule');
		this.name = 'PasswordPolicyError';
	}
}

export function checkPasswordPolicy(password: string) {
	return (
		password.length >= PASSWORD_MIN_LENGTH &&
		password.length <= PASSWORD_MAX_LENGTH
	);
}

export async function hashPassword(password: string) {
	if (!checkPasswordPolicy(password)) {
		throw new PasswordPolicyError();
	}

	return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
	return verify(passwordHash, password, ARGON2_OPTIONS);
}

export async function consumePasswordVerificationCost(password: string) {
	await verifyPassword(DUMMY_PASSWORD_HASH, password);
}
