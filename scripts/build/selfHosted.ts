import nextEnv from '@next/env';
import assert from 'node:assert/strict';
import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { argv, cwd, execPath } from 'node:process';
import { fileURLToPath } from 'node:url';

import {
	clearDeploymentMaintenance,
	upsertDeploymentMaintenance,
} from '../../app/features/siteStatus/server/maintenanceRepository';
import { getConfiguredSqliteDatabasePath } from '../../app/infrastructure/database/config';
import { migrateSiteRuntimeStateTable } from '../../app/infrastructure/database/migrations/siteStatus';
import { createSqliteDatabase } from '../../app/infrastructure/database/sqlite/createDatabase';
import { checkRetryableSqliteLockError } from '../../app/infrastructure/database/sqlite/lockErrors';
import { checkEnvironmentFlag } from '../../app/infrastructure/environment/flags';
import { getLogSafeErrorCode } from '../../app/infrastructure/logging/errorCode';
import { publishSelfHostedRelease } from '../deployment/publishRelease';
import { getDeploymentPaths } from '../deployment/releasePaths.mjs';
import {
	DEPLOYMENT_MAINTENANCE_TTL_MS,
	clearSiteStatusBuildIdentity,
	writeSiteStatusBuildIdentity,
} from '../deployment/siteStatusBuild';

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
	publishRelease: () => Promise<unknown>;
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
const moduleRequire = createRequire(import.meta.url);
const commandPathMap = {
	next: moduleRequire.resolve('next/dist/bin/next'),
	tsx: moduleRequire.resolve('tsx/cli'),
} as const;

function normalizeRelativePath(projectDirectory: string, path: string) {
	return relative(projectDirectory, path).split('\\').join('/');
}

async function checkSelfHostedBuildPaths(projectDirectory: string) {
	const deploymentPaths = getDeploymentPaths(projectDirectory);
	const paths = {
		deploy: deploymentPaths.deployDirectory,
		nextStandalone: resolve(projectDirectory, '.next/standalone'),
		nextStatic: resolve(projectDirectory, '.next/static'),
		public: resolve(projectDirectory, 'public'),
		root: resolve(projectDirectory),
	};

	assert.deepEqual(paths, {
		deploy: resolve(projectDirectory, '.deploy'),
		nextStandalone: resolve(projectDirectory, '.next/standalone'),
		nextStatic: resolve(projectDirectory, '.next/static'),
		public: resolve(projectDirectory, 'public'),
		root: resolve(projectDirectory),
	});
	await access(paths.public);
	Object.entries(paths).forEach(([name, path]) => {
		console.log(
			`${name}: ${path === paths.root ? '.' : normalizeRelativePath(paths.root, path)}`
		);
	});
}

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

async function wait(delayMs: number) {
	await new Promise<void>((resolvePromise) => {
		setTimeout(resolvePromise, delayMs);
	});
}

async function withShortLivedDatabase<T>(
	operation: (database: ReturnType<typeof createSqliteDatabase>) => Promise<T>
) {
	const databasePath = getConfiguredSqliteDatabasePath(
		process.env.SQLITE_DATABASE_PATH
	);
	const database = createSqliteDatabase({
		busyTimeoutMs: 1000,
		databasePath,
	});

	try {
		await migrateSiteRuntimeStateTable(database);
		return await database.transaction().execute(operation);
	} finally {
		await database.destroy();
	}
}

async function runWithRetry<T>(operation: () => Promise<T>) {
	for (let attempt = 0; ; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			const retryDelay = RETRY_DELAYS_MS[attempt];
			if (
				retryDelay === undefined ||
				!checkRetryableSqliteLockError(error)
			) {
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

export async function runBuildCoordinator({
	clearBuildIdentity,
	clearMaintenance,
	enableMaintenance,
	now,
	operationId,
	publishRelease,
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
		if (runtimeEnabled) {
			await publishRelease();
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
		checkEnvironmentFlag(process.env.SELF_HOSTED) &&
		!checkEnvironmentFlag(process.env.VERCEL) &&
		!checkEnvironmentFlag(process.env.OFFLINE);
	const operationId = randomUUID();
	let activeChild: ChildProcess | null = null;
	const stageCommands = {
		'babel-transform': ['tsx', ['scripts/build/babelTransform.ts']],
		'next-build': ['next', ['build']],
		'service-worker': ['tsx', ['scripts/build/serviceWorker/generate.ts']],
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
			publishRelease: async () =>
				await publishSelfHostedRelease({
					operationId,
					projectDirectory,
				}),
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
const isEntry =
	entryPath !== undefined &&
	resolve(entryPath) === fileURLToPath(import.meta.url);
const isSelfCheck = argv.includes('--self-check-paths');

if (isEntry && isSelfCheck) {
	await checkSelfHostedBuildPaths(cwd());
}
if (isEntry && !isSelfCheck) {
	await main();
}
