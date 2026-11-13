import { ACCOUNT_STORAGE_KEY_MAP } from '@/features/account/client/storageKeys';
import { type TInitialAccountWorkspaceAuth } from '@/features/account/client/workspace/contracts';

export type TInitialWorkspaceAuth = TInitialAccountWorkspaceAuth;

const script = (
	isAccountFeatureClientEnabled: boolean,
	ownerStorageKey: string,
	transitionStorageKey: string,
	initialAuth: TInitialWorkspaceAuth
) => {
	try {
		const readStorage = (storage: Storage, key: string) => {
			try {
				return storage.getItem(key);
			} catch {
				return null;
			}
		};
		let ownerRaw: string | null | undefined;
		let transitionRaw: string | null | undefined;
		try {
			ownerRaw = readStorage(localStorage, ownerStorageKey);
			transitionRaw = readStorage(localStorage, transitionStorageKey);
		} catch {
			ownerRaw = undefined;
		}
		try {
			ownerRaw ??= readStorage(sessionStorage, ownerStorageKey);
			transitionRaw ??= readStorage(sessionStorage, transitionStorageKey);
		} catch {
			/* Fall through to pending when no storage is readable. */
		}

		const checkUserId = (value: unknown): value is string =>
			typeof value === 'string' &&
			value.length > 0 &&
			value.length <= 128 &&
			/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value);
		const parseOwner = (raw: string | null | undefined) => {
			if (raw === null || raw === undefined) {
				return { status: 'none' as const };
			}
			let value: unknown;
			try {
				value = JSON.parse(raw);
			} catch {
				return { status: 'invalid' as const };
			}
			if (typeof value !== 'object' || value === null) {
				return { status: 'invalid' as const };
			}
			const record = value as Record<string, unknown>;
			if (
				typeof record['version'] === 'number' &&
				record['version'] > 1
			) {
				return { status: 'future' as const };
			}
			const { generation, owner } = record;
			if (
				record['version'] !== 1 ||
				typeof generation !== 'number' ||
				!Number.isSafeInteger(generation) ||
				generation < 0 ||
				generation >= Number.MAX_SAFE_INTEGER ||
				typeof owner !== 'object' ||
				owner === null
			) {
				return { status: 'invalid' as const };
			}
			const ownerRecord = owner as Record<string, unknown>;
			if (ownerRecord['kind'] === 'guest') {
				return { kind: 'guest' as const, status: 'current' as const };
			}
			if (
				ownerRecord['kind'] === 'account' &&
				checkUserId(ownerRecord['userId'])
			) {
				return {
					kind: 'account' as const,
					status: 'current' as const,
					userId: ownerRecord['userId'],
				};
			}
			return { status: 'invalid' as const };
		};

		const shouldShow =
			!isAccountFeatureClientEnabled &&
			(transitionRaw !== null && transitionRaw !== undefined
				? false
				: (() => {
						const owner = parseOwner(ownerRaw);
						if (owner.status !== 'current') {
							return false;
						}
						if (initialAuth.kind === 'unknown') {
							return true;
						}
						if (initialAuth.kind === 'anonymous') {
							return owner.kind === 'guest';
						}
						return (
							owner.kind === 'account' &&
							owner.userId === initialAuth.userId
						);
					})());

		if (shouldShow) {
			delete document.documentElement.dataset['workspacePending'];
		} else {
			document.documentElement.dataset['workspacePending'] = 'true';
		}
	} catch {
		try {
			document.documentElement.dataset['workspacePending'] = 'true';
		} catch {
			/* The browser is already in an unrecoverable startup state. */
		}
	}
};

interface IProps {
	isAccountFeatureClientEnabled: boolean;
	initialAuth: TInitialWorkspaceAuth;
}

export default function WorkspaceOwnerGateScript({
	initialAuth,
	isAccountFeatureClientEnabled,
}: IProps) {
	const scriptArgs = JSON.stringify([
		isAccountFeatureClientEnabled,
		ACCOUNT_STORAGE_KEY_MAP.workspaceOwner,
		ACCOUNT_STORAGE_KEY_MAP.workspaceTransition,
		initialAuth,
	])
		.slice(1, -1)
		.replaceAll('<', String.raw`\u003c`);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
