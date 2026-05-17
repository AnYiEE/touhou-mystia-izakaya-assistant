import { hash, verify } from '@node-rs/argon2';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const ARGON2_OPTIONS = {
	memoryCost: 19456,
	outputLen: 32,
	parallelism: 1,
	timeCost: 2,
} as const;

export function checkPasswordPolicy(password: string) {
	return (
		password.length >= PASSWORD_MIN_LENGTH &&
		password.length <= PASSWORD_MAX_LENGTH
	);
}

export async function hashPassword(password: string) {
	return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
	return verify(passwordHash, password, ARGON2_OPTIONS);
}
