import { type NextRequest, type NextResponse } from 'next/server';

import {
	type AuthenticationResponseJSON,
	type AuthenticatorTransportFuture,
	type RegistrationResponseJSON,
	type WebAuthnCredential,
	generateAuthenticationOptions,
	generateRegistrationOptions,
	verifyAuthenticationResponse,
	verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import { SERVER_MISCONFIGURED_MESSAGE } from './environment';
import { getAccountCookieSecureFlag } from './request';
import {
	createAccountCookieDomainOptions,
	getAccountCookieDomain,
} from './session';
import { siteConfig } from '@/configs/site';
import {
	ACCOUNT_COOKIE_NAME_MAP,
	WEBAUTHN_CHALLENGE_TTL_MS,
} from '@/lib/account/shared/constants';
import type { TUser, TUserWebauthnCredential } from '@/lib/db/types';

const WEBAUTHN_CHALLENGE_COOKIE_NAME =
	ACCOUNT_COOKIE_NAME_MAP.webauthnChallenge;

interface IWebAuthnRelyingParty {
	expectedOrigin: string[];
	rpID: string;
	rpName: string;
}

function parseExpectedOrigins() {
	const origins = (process.env.SERVICE_ALLOWED_ORIGINS ?? '')
		.split(',')
		.map((item) => {
			try {
				return new URL(item.trim()).origin;
			} catch {
				return null;
			}
		})
		.filter((origin): origin is string => origin !== null);

	return origins.length > 0 ? origins : [siteConfig.baseOrigin];
}

function resolveRpID() {
	const configuredRpId = process.env.WEBAUTHN_RP_ID?.trim();
	if (configuredRpId !== undefined && configuredRpId !== '') {
		return configuredRpId;
	}

	const cookieDomain = getAccountCookieDomain();
	if (cookieDomain === undefined) {
		return new URL(siteConfig.baseOrigin).hostname;
	}

	return cookieDomain.replace(/^\./u, '');
}

export function getWebAuthnRelyingParty(): IWebAuthnRelyingParty {
	const expectedOrigin = parseExpectedOrigins();
	const rpID = resolveRpID();

	for (const origin of expectedOrigin) {
		const { hostname } = new URL(origin);
		if (hostname !== rpID && !hostname.endsWith(`.${rpID}`)) {
			throw new Error(SERVER_MISCONFIGURED_MESSAGE);
		}
	}

	return { expectedOrigin, rpID, rpName: siteConfig.name };
}

export function setWebauthnChallengeCookie(
	response: NextResponse,
	challengeId: string,
	request: NextRequest
) {
	response.cookies.set(WEBAUTHN_CHALLENGE_COOKIE_NAME, challengeId, {
		...createAccountCookieDomainOptions(),
		httpOnly: true,
		maxAge: Math.floor(WEBAUTHN_CHALLENGE_TTL_MS / 1000),
		path: '/',
		sameSite: 'lax',
		secure: getAccountCookieSecureFlag(request),
	});
}

export function getWebauthnChallengeCookie(request: NextRequest) {
	return request.cookies.get(WEBAUTHN_CHALLENGE_COOKIE_NAME)?.value;
}

export function clearWebauthnChallengeCookie(
	response: NextResponse,
	request: NextRequest
) {
	response.cookies.set(WEBAUTHN_CHALLENGE_COOKIE_NAME, '', {
		...createAccountCookieDomainOptions(),
		httpOnly: true,
		maxAge: 0,
		path: '/',
		sameSite: 'lax',
		secure: getAccountCookieSecureFlag(request),
	});
}

export function encodePublicKey(publicKey: Uint8Array<ArrayBuffer>) {
	return isoBase64URL.fromBuffer(publicKey);
}

export function parseTransports(
	value: TUserWebauthnCredential['transports']
): AuthenticatorTransportFuture[] {
	try {
		const parsed: unknown = JSON.parse(value);

		return Array.isArray(parsed)
			? (parsed as AuthenticatorTransportFuture[])
			: [];
	} catch {
		return [];
	}
}

export function serializeTransports(
	transports: AuthenticatorTransportFuture[] | undefined
) {
	return JSON.stringify(transports ?? []);
}

export function toWebAuthnCredential(
	credential: TUserWebauthnCredential
): WebAuthnCredential {
	return {
		counter: credential.counter,
		id: credential.credential_id,
		publicKey: isoBase64URL.toBuffer(credential.public_key),
		transports: parseTransports(credential.transports),
	};
}

export function buildRegistrationOptions({
	existingCredentials,
	user,
}: {
	existingCredentials: Array<
		Pick<TUserWebauthnCredential, 'credential_id' | 'transports'>
	>;
	user: Pick<TUser, 'id' | 'nickname' | 'username'>;
}) {
	const { rpID, rpName } = getWebAuthnRelyingParty();

	return generateRegistrationOptions({
		attestationType: 'none',
		authenticatorSelection: {
			residentKey: 'required',
			userVerification: 'preferred',
		},
		excludeCredentials: existingCredentials.map((credential) => ({
			id: credential.credential_id,
			transports: parseTransports(credential.transports),
		})),
		rpID,
		rpName,
		userDisplayName: user.nickname ?? user.username,
		userID: Uint8Array.from(new TextEncoder().encode(user.id)),
		userName: user.username,
	});
}

export function verifyRegistration({
	expectedChallenge,
	response,
}: {
	expectedChallenge: string;
	response: RegistrationResponseJSON;
}) {
	const { expectedOrigin, rpID } = getWebAuthnRelyingParty();

	return verifyRegistrationResponse({
		expectedChallenge,
		expectedOrigin,
		expectedRPID: rpID,
		requireUserVerification: false,
		response,
	});
}

export function buildAuthenticationOptions() {
	const { rpID } = getWebAuthnRelyingParty();

	return generateAuthenticationOptions({
		allowCredentials: [],
		rpID,
		userVerification: 'preferred',
	});
}

export function verifyAuthentication({
	credential,
	expectedChallenge,
	response,
}: {
	credential: WebAuthnCredential;
	expectedChallenge: string;
	response: AuthenticationResponseJSON;
}) {
	const { expectedOrigin, rpID } = getWebAuthnRelyingParty();

	return verifyAuthenticationResponse({
		credential,
		expectedChallenge,
		expectedOrigin,
		expectedRPID: rpID,
		requireUserVerification: false,
		response,
	});
}
