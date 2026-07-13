import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { cwd, execPath } from 'node:process';

import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import nextEnv from '@next/env';

import {
	clearDeploymentMaintenance,
	migrateSiteRuntimeStateTable,
	upsertDeploymentMaintenance,
} from '../app/lib/siteStatus/server/runtimeState';
import {
	DEPLOYMENT_MAINTENANCE_TTL_MS,
	SITE_STATUS_BUILD_IDENTITY_FILE_NAME,
} from '../app/lib/siteStatus/shared/constants';
import { getConfiguredSqliteDatabasePath } from '../app/lib/db/constant';
import { type TDatabase } from '../app/lib/db/types';
import {
	checkEnvFlag,
	checkOfflineEnv,
	checkVercelEnv,
} from '../app/lib/environment';
import { getLogSafeErrorCode } from '../app/lib/logging';

export type TBuildStage = 'babel-transform' | 'next-build' | 'service-worker';

interface IBuildCoordinatorOptions {
	clearBuildIdentity: () => void;
	clearMaintenance: (operationId: string) => Promise<unknown>;
	enableMaintenance: (
		operationId: string,
		startedAt: number
	) => Promise<boolean>;
	now: () => number;
	operationId: string;
	runStage: (stage: TBuildStage) => Promise<void>;
	runtimeEnabled: boolean;
	writeBuildIdentity: (operationId: string) => void;
}

const BUILD_STAGES = [
	'service-worker',
	'next-build',
	'babel-transform',
] as const satisfies ReadonlyArray<TBuildStage>;
const RETRY_DELAYS_MS = [50, 100, 250, 500] as const;
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const moduleRequire = createRequire(import.meta.url);
const commandPathMap = {
	next: moduleRequire.resolve('next/dist/bin/next'),
	tsx: moduleRequire.resolve('tsx/cli'),
} as const;

class BuildStageError extends Error {
	readonly exitCode: number;
	readonly signal: NodeJS.Signals | null;
	readonly stage: TBuildStage;

	constructor(
		stage: TBuildStage,
		exitCode: number,
		signal: NodeJS.Signals | null
	) {
		super(`build-stage-failed:${stage}`);
		this.name = 'BuildStageError';
		this.exitCode = exitCode;
		this.signal = signal;
		this.stage = stage;
	}
}

function checkRetryableSqliteError(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}
	const { code } = error as NodeJS.ErrnoException;
	return (
		code === 'SQLITE_BUSY' ||
		code === 'SQLITE_LOCKED' ||
		error.message.includes('database is locked')
	);
}

async function wait(delayMs: number) {
	await new Promise<void>((resolvePromise) => {
		setTimeout(resolvePromise, delayMs);
	});
}

async function withShortLivedDatabase<T>(
	operation: (database: Kysely<TDatabase>) => Promise<T>
) {
	const databasePath = getConfiguredSqliteDatabasePath(
		process.env.SQLITE_DATABASE_PATH
	);
	const nativeDatabase = new Database(databasePath);
	let database: Kysely<TDatabase> | null = null;

	try {
		nativeDatabase.pragma('foreign_keys = ON');
		nativeDatabase.pragma('busy_timeout = 1000');
		nativeDatabase.pragma('journal_mode = WAL');
		database = new Kysely<TDatabase>({
			dialect: new SqliteDialect({ database: nativeDatabase }),
		});
		await migrateSiteRuntimeStateTable(database);
		return await database.transaction().execute(operation);
	} finally {
		if (database === null) {
			nativeDatabase.close();
		} else {
			await database.destroy();
		}
	}
}

async function runWithRetry<T>(operation: () => Promise<T>) {
	for (let attempt = 0; ; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			const retryDelay = RETRY_DELAYS_MS[attempt];
			if (retryDelay === undefined || !checkRetryableSqliteError(error)) {
				throw error;
			}
			await wait(retryDelay);
		}
	}
}

export async function attemptEnableDeploymentMaintenance(
	operationId: string,
	startedAt = Date.now()
) {
	try {
		await runWithRetry(async () => {
			await withShortLivedDatabase(async (database) => {
				await upsertDeploymentMaintenance(database, {
					expiresAt: startedAt + DEPLOYMENT_MAINTENANCE_TTL_MS,
					operationId,
					startedAt,
				});
			});
		});
		return true;
	} catch (error) {
		console.warn('Deployment maintenance state enable failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return false;
	}
}

export async function attemptClearDeploymentMaintenance(operationId: string) {
	try {
		return await runWithRetry(
			async () =>
				await withShortLivedDatabase(
					async (database) =>
						await clearDeploymentMaintenance(database, operationId)
				)
		);
	} catch (error) {
		console.warn('Deployment maintenance state cleanup failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return false;
	}
}

function validateOperationId(operationId: string) {
	if (!UUID_PATTERN.test(operationId)) {
		throw new Error('invalid-site-status-build-operation-id');
	}
	return operationId;
}

function getBuildIdentityPath(projectDirectory: string) {
	return resolve(projectDirectory, SITE_STATUS_BUILD_IDENTITY_FILE_NAME);
}

export function readSiteStatusBuildIdentity(projectDirectory: string) {
	try {
		return validateOperationId(
			readFileSync(getBuildIdentityPath(projectDirectory), 'utf8').trim()
		);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

export function writeSiteStatusBuildIdentity(
	projectDirectory: string,
	operationId: string
) {
	const path = getBuildIdentityPath(projectDirectory);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, validateOperationId(operationId), {
		encoding: 'utf8',
		mode: 0o600,
	});
}

export function clearSiteStatusBuildIdentity(projectDirectory: string) {
	try {
		rmSync(getBuildIdentityPath(projectDirectory), { force: true });
	} catch (error) {
		console.warn('Site status build identity cleanup failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export async function runBuildCoordinator({
	clearBuildIdentity,
	clearMaintenance,
	enableMaintenance,
	now,
	operationId,
	runStage,
	runtimeEnabled,
	writeBuildIdentity,
}: IBuildCoordinatorOptions) {
	let maintenanceEnabled = false;
	let completed = false;

	try {
		if (runtimeEnabled) {
			maintenanceEnabled = await enableMaintenance(operationId, now());
			writeBuildIdentity(operationId);
		}
		for (const stage of BUILD_STAGES) {
			await runStage(stage);
		}
		completed = true;
	} finally {
		if (!completed && maintenanceEnabled) {
			await clearMaintenance(operationId);
		}
		if (runtimeEnabled) {
			clearBuildIdentity();
		}
	}
}

async function main() {
	const projectDirectory = cwd();
	nextEnv.loadEnvConfig(projectDirectory);
	const runtimeEnabled =
		checkEnvFlag(process.env.SELF_HOSTED) &&
		!checkVercelEnv(process.env.VERCEL) &&
		!checkOfflineEnv(process.env.OFFLINE);
	const operationId = randomUUID();
	let activeChild: ChildProcess | null = null;
	const stageCommands = {
		'babel-transform': ['tsx', ['scripts/babelTransformFile.ts']],
		'next-build': ['next', ['build']],
		'service-worker': ['tsx', ['scripts/generateServiceWorker.ts']],
	} as const satisfies Record<
		TBuildStage,
		readonly [keyof typeof commandPathMap, ReadonlyArray<string>]
	>;
	const signalState: {
		cleanupPromise: Promise<unknown> | null;
		received: NodeJS.Signals | null;
	} = { cleanupPromise: null, received: null };
	const stopActiveChild = (signal: NodeJS.Signals) => {
		if (activeChild === null) {
			return;
		}
		if (process.platform !== 'win32' && activeChild.pid !== undefined) {
			try {
				process.kill(-activeChild.pid, signal);
				return;
			} catch {
				// Fall back to signaling the direct child below.
			}
		}
		activeChild.kill(signal);
	};
	const handleSignal = (signal: NodeJS.Signals) => {
		signalState.received ??= signal;
		if (runtimeEnabled && signalState.cleanupPromise === null) {
			clearSiteStatusBuildIdentity(projectDirectory);
			signalState.cleanupPromise =
				attemptClearDeploymentMaintenance(operationId);
		}
		stopActiveChild(signal);
	};
	const signalHandlers = {
		SIGINT: () => {
			handleSignal('SIGINT');
		},
		SIGTERM: () => {
			handleSignal('SIGTERM');
		},
	} as const;
	process.on('SIGINT', signalHandlers.SIGINT);
	process.on('SIGTERM', signalHandlers.SIGTERM);

	const runStage = async (stage: TBuildStage) => {
		if (signalState.received !== null) {
			throw new BuildStageError(stage, 1, signalState.received);
		}
		const [command, args] = stageCommands[stage];
		const commandArgs = [commandPathMap[command], ...args];
		await new Promise<void>((resolvePromise, reject) => {
			const child = spawn(execPath, commandArgs, {
				cwd: projectDirectory,
				detached: process.platform !== 'win32',
				stdio: 'inherit',
			});
			activeChild = child;
			child.once('error', (error) => {
				activeChild = null;
				reject(error);
			});
			child.once('close', (code, signal) => {
				activeChild = null;
				if (code === 0 && signal === null) {
					resolvePromise();
					return;
				}
				reject(new BuildStageError(stage, code ?? 1, signal));
			});
		});
	};

	try {
		await runBuildCoordinator({
			clearBuildIdentity: () => {
				clearSiteStatusBuildIdentity(projectDirectory);
			},
			clearMaintenance: attemptClearDeploymentMaintenance,
			enableMaintenance: attemptEnableDeploymentMaintenance,
			now: Date.now,
			operationId,
			runStage,
			runtimeEnabled,
			writeBuildIdentity: (value) => {
				writeSiteStatusBuildIdentity(projectDirectory, value);
			},
		});
	} catch (error) {
		if (signalState.received === null) {
			console.error(
				'Production build failed.',
				error instanceof BuildStageError
					? { exitCode: error.exitCode, stage: error.stage }
					: { errorCode: getLogSafeErrorCode(error) }
			);
			// eslint-disable-next-line require-atomic-updates -- Build coordination and maintenance cleanup have completed before the final process status is assigned.
			process.exitCode =
				error instanceof BuildStageError ? error.exitCode : 1;
		}
	} finally {
		process.off('SIGINT', signalHandlers.SIGINT);
		process.off('SIGTERM', signalHandlers.SIGTERM);
	}
	if (signalState.cleanupPromise !== null) {
		await signalState.cleanupPromise;
	}

	if (signalState.received !== null) {
		process.kill(process.pid, signalState.received);
	}
}

const [, entryPath] = process.argv;
if (
	entryPath !== undefined &&
	resolve(entryPath) === fileURLToPath(import.meta.url)
) {
	await main();
}
