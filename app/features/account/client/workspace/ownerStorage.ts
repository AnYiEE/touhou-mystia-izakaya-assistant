import {
	ACCOUNT_STORAGE_KEY_MAP,
	readAccountStorage,
	writeAccountStorage,
} from '@/features/account/client/storage';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import {
	type IStoredAccountWorkspace,
	type TAccountWorkspaceOwner,
	type TStoredAccountWorkspaceParse,
	type TStoredAccountWorkspaceRead,
} from './contracts';

const ACCOUNT_WORKSPACE_USER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const ACCOUNT_WORKSPACE_USER_ID_MAX_LENGTH = 128;

export function checkAccountWorkspaceUserId(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.length > 0 &&
		value.length <= ACCOUNT_WORKSPACE_USER_ID_MAX_LENGTH &&
		ACCOUNT_WORKSPACE_USER_ID_PATTERN.test(value)
	);
}

export function parseStoredWorkspaceOwner(
	value: unknown
): { kind: 'guest' } | { kind: 'account'; userId: string } | null {
	if (!checkIsRecord(value)) {
		return null;
	}

	if (value['kind'] === 'guest') {
		return { kind: 'guest' };
	}
	if (
		value['kind'] === 'account' &&
		checkAccountWorkspaceUserId(value['userId'])
	) {
		return { kind: 'account', userId: value['userId'] };
	}

	return null;
}

export function parseStoredAccountWorkspace(
	value: unknown
): TStoredAccountWorkspaceParse {
	if (!checkIsRecord(value)) {
		return { status: 'invalid' };
	}

	const { generation, owner, version } = value;
	if (
		typeof version === 'number' &&
		Number.isSafeInteger(version) &&
		version > 1
	) {
		return { status: 'future' };
	}
	if (
		version !== 1 ||
		!isNonNegativeSafeInteger(generation) ||
		generation >= Number.MAX_SAFE_INTEGER
	) {
		return { status: 'invalid' };
	}

	const parsedOwner = parseStoredWorkspaceOwner(owner);
	if (parsedOwner === null) {
		return { status: 'invalid' };
	}

	return {
		status: 'current',
		workspace: { generation, owner: parsedOwner, version: 1 },
	};
}

export function createAccountWorkspaceOwnerKey() {
	return ACCOUNT_STORAGE_KEY_MAP.workspaceOwner;
}

export function createAccountWorkspaceTransitionKey() {
	return ACCOUNT_STORAGE_KEY_MAP.workspaceTransition;
}

export function readStoredAccountWorkspaceRaw() {
	try {
		return {
			status: 'ok' as const,
			value: readAccountStorage(createAccountWorkspaceOwnerKey()),
		};
	} catch {
		return { status: 'storage-unavailable' as const };
	}
}

export function readStoredAccountWorkspace(): TStoredAccountWorkspaceRead {
	const rawResult = readStoredAccountWorkspaceRaw();
	if (rawResult.status === 'storage-unavailable') {
		return { status: 'storage-unavailable' };
	}

	const raw = rawResult.value;
	if (raw === null) {
		return { status: 'none' };
	}

	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return { raw, status: 'invalid' };
	}

	const parsed = parseStoredAccountWorkspace(value);
	if (parsed.status !== 'current') {
		return { raw, status: parsed.status };
	}

	return { raw, status: 'current', workspace: parsed.workspace };
}

function checkStoredAccountWorkspaceEqual(
	left: IStoredAccountWorkspace,
	right: IStoredAccountWorkspace
) {
	return (
		left.generation === right.generation &&
		left.owner.kind === right.owner.kind &&
		(left.owner.kind === 'guest' ||
			(right.owner.kind === 'account' &&
				left.owner.userId === right.owner.userId))
	);
}

export function writeStoredAccountWorkspace(
	workspace: IStoredAccountWorkspace
) {
	const parsed = parseStoredAccountWorkspace(workspace);
	if (parsed.status !== 'current') {
		return false;
	}

	try {
		writeAccountStorage(
			createAccountWorkspaceOwnerKey(),
			JSON.stringify(parsed.workspace)
		);
	} catch {
		return false;
	}

	const current = readStoredAccountWorkspace();
	return (
		current.status === 'current' &&
		checkStoredAccountWorkspaceEqual(current.workspace, parsed.workspace)
	);
}

export function writeStoredAccountWorkspaceIfCurrent(
	expectedRaw: string | null,
	workspace: IStoredAccountWorkspace
) {
	const currentRaw = readStoredAccountWorkspaceRaw();
	if (
		currentRaw.status !== 'ok' ||
		currentRaw.value !== expectedRaw ||
		parseStoredAccountWorkspace(workspace).status !== 'current'
	) {
		return false;
	}

	if (!writeStoredAccountWorkspace(workspace)) {
		return false;
	}

	const current = readStoredAccountWorkspace();
	return (
		current.status === 'current' &&
		checkStoredAccountWorkspaceEqual(current.workspace, workspace)
	);
}

export function toStoredAccountWorkspaceOwner(
	owner: TAccountWorkspaceOwner
): IStoredAccountWorkspace['owner'] {
	return owner.kind === 'guest'
		? { kind: 'guest' }
		: { kind: 'account', userId: owner.userId };
}
