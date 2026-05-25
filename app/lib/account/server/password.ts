import { hash, verify } from '@node-rs/argon2';

import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from '@/lib/account/shared/constants';

export {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from '@/lib/account/shared/constants';

export const ARGON2_OPTIONS = {
	memoryCost: 19456,
	outputLen: 32,
	parallelism: 1,
	timeCost: 2,
} as const;

const DUMMY_PASSWORD_HASH =
	'$argon2id$v=19$m=19456,t=2,p=1$6KmvqCVltIc8Fl1NcSZWJA$T+3fu6nQ45w3+SZzjQI5aWIN42dw9pU8K//r1DoiuOg';
const DUMMY_PASSWORD = 'dummy-password';

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

export async function consumePasswordVerificationCost(password: string) {
	await verify(
		DUMMY_PASSWORD_HASH,
		checkPasswordPolicy(password) ? password : DUMMY_PASSWORD,
		ARGON2_OPTIONS
	);
}

export async function verifyPassword(passwordHash: string, password: string) {
	if (!checkPasswordPolicy(password)) {
		await consumePasswordVerificationCost(password);
		return false;
	}

	try {
		return await verify(passwordHash, password, ARGON2_OPTIONS);
	} catch {
		await consumePasswordVerificationCost(password);
		return false;
	}
}
