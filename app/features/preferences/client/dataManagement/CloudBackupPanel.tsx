import { faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import isObject from 'lodash/isObject.js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Snippet from '@/design/ui/components/snippet';
import TimeAgo from '@/design/ui/components/timeAgo';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useAnonymousVisitorId } from '@/features/analytics/client/visitorIdentity';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import {
	LEGACY_BACKUP_FREQUENCY_TTL,
	deleteLegacyBackup,
	downloadLegacyBackup,
	fetchLegacyBackupMetadata,
	uploadLegacyBackup,
} from '@/features/legacyBackup/client/api';
import {
	type TPreferencesMessageKey,
	preferencesMessages,
} from '@/features/preferences/client/messages';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { type TMessageParams } from '@/shared/i18n/messages';
import { useI18n } from '@/shared/i18n/useI18n';

import {
	LEGACY_CLOUD_BACKUP_MESSAGE_KEYS,
	LEGACY_CLOUD_DELETE_BUTTON_LABEL_KEYS,
	LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_KEYS,
	LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_KEYS,
} from './copy';
import { parseGuestDataImport } from './parseGuestDataImport';

type TCloudState = 'danger' | 'default' | 'success';

type TCloudLabelSuffix =
	{ key: TPreferencesMessageKey; params?: TMessageParams } | { text: string };

interface ICloudButtonLabel {
	key: TPreferencesMessageKey;
	suffix?: TCloudLabelSuffix;
}

type TCloudCodeInfo =
	| { createdAt: number; kind: 'meta'; lastAccessed: number }
	| { kind: 'empty' }
	| { key: TPreferencesMessageKey; kind: 'message'; params?: TMessageParams }
	| null;

const CLOUD_CODE_CLASS_NAMES = {
	pre: 'flex max-w-screen-p-60 items-center whitespace-normal break-all',
} as const;

function setErrorState({
	error,
	labelKey,
	setLabel,
	setState,
	type,
}: {
	error: unknown;
	labelKey: TPreferencesMessageKey;
	setLabel: (label: ICloudButtonLabel) => void;
	setState: (state: TCloudState) => void;
	type: 'Delete' | 'Download' | 'Upload';
}) {
	setState('danger');
	const label: ICloudButtonLabel = { key: labelKey };
	if (Error.isError(error)) {
		console.error({ errorCode: getLogSafeErrorCode(error) });
		label.suffix = { key: 'preferences.cloud.networkError' };
		trackEvent(trackEvent.category.error, 'Cloud', type, error.message);
	} else {
		const {
			data: { message },
			status,
		} = error as { data: { message: string }; status: number };
		console.error({ message, status });
		label.suffix =
			status === 400
				? { key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.invalidCode }
				: status === 404
					? { key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.targetNotFound }
					: status === 409
						? { key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.busy }
						: status === 429
							? {
									key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.retry,
									params: {
										minutes:
											LEGACY_BACKUP_FREQUENCY_TTL /
											1000 /
											60,
									},
								}
							: { text: String(status) };
		if (type === 'Delete' && status === 404) {
			globalStore.persistence.cloudCode.set(null);
		}
		trackEvent(trackEvent.category.error, 'Cloud', type, status);
	}
	setLabel(label);
}

export default memo(function CloudBackupPanel() {
	const currentNormalMealData = normalGuestStore.persistence.meals.use();
	const currentRareMealData = specialGuestStore.persistence.meals.use();
	const { t } = useI18n(preferencesMessages);

	const renderLabel = useCallback(
		(label: ICloudButtonLabel) =>
			label.suffix === undefined
				? t(label.key)
				: t('preferences.cloud.format.suffix', {
						message:
							'key' in label.suffix
								? t(label.suffix.key, label.suffix.params)
								: label.suffix.text,
					}),
		[t]
	);

	const currentMealData = useMemo(
		() => ({
			customer_normal: currentNormalMealData,
			customer_rare: currentRareMealData,
		}),
		[currentNormalMealData, currentRareMealData]
	);

	const [isCloudDeleteButtonDisabled, setIsCloudDeleteButtonDisabled] =
		useState(false);
	const [cloudDeleteButtonLabel, setCloudDeleteButtonLabel] =
		useState<ICloudButtonLabel>({
			key: LEGACY_CLOUD_DELETE_BUTTON_LABEL_KEYS.delete,
		});
	const [cloudDeleteState, setCloudDeleteState] =
		useState<TCloudState>('default');

	const [isCloudDownloadButtonDisabled, setIsCloudDownloadButtonDisabled] =
		useState(false);
	const [cloudDownloadButtonLabel, setCloudDownloadButtonLabel] =
		useState<ICloudButtonLabel>({
			key: LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_KEYS.download,
		});
	const [cloudDownloadState, setCloudDownloadState] =
		useState<TCloudState>('default');

	const [isCloudUploadButtonDisabled, setIsCloudUploadButtonDisabled] =
		useState(false);
	const [cloudUploadButtonLabel, setCloudUploadButtonLabel] =
		useState<ICloudButtonLabel>({
			key: LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_KEYS.upload,
		});
	const [cloudUploadState, setCloudUploadState] =
		useState<TCloudState>('default');

	const isCloudDoing =
		isCloudDeleteButtonDisabled ||
		isCloudDownloadButtonDisabled ||
		isCloudUploadButtonDisabled;

	const cloudTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

	useEffect(
		() => () => {
			cloudTimers.current.forEach(clearTimeout);
		},
		[]
	);

	const currentCloudCode = globalStore.persistence.cloudCode.use();
	const userId = useAnonymousVisitorId();

	const isCloudCodeValid = (currentCloudCode?.trim() ?? '').length > 0;

	const [cloudCodeInfo, setCloudCodeInfo] = useState<TCloudCodeInfo>(null);
	const cloudCodeInfoRequestIdRef = useRef(0);

	const updateCloudCodeInfo = useCallback(
		(cloudCode: typeof currentCloudCode) => {
			cloudCodeInfoRequestIdRef.current += 1;

			const requestId = cloudCodeInfoRequestIdRef.current;
			const normalizedCode = cloudCode?.trim() ?? null;

			if (normalizedCode === null || normalizedCode === '') {
				setCloudCodeInfo({ kind: 'empty' });
				return;
			}
			fetchLegacyBackupMetadata(normalizedCode)
				.then(({ created_at, last_accessed }) => {
					if (cloudCodeInfoRequestIdRef.current !== requestId) {
						return;
					}

					setCloudCodeInfo({
						createdAt: created_at,
						kind: 'meta',
						lastAccessed: last_accessed,
					});
				})
				.catch((error: unknown) => {
					if (cloudCodeInfoRequestIdRef.current !== requestId) {
						return;
					}

					if (isObject(error) && 'status' in error) {
						const status = error.status as number;
						setCloudCodeInfo(
							status === 404
								? {
										key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.codeNotFound,
										kind: 'message',
									}
								: status === 409
									? {
											key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.busy,
											kind: 'message',
										}
									: status === 429
										? {
												key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.retry,
												kind: 'message',
												params: {
													minutes:
														LEGACY_BACKUP_FREQUENCY_TTL /
														1000 /
														60,
												},
											}
										: {
												key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.invalidCode,
												kind: 'message',
											}
						);
					} else {
						setCloudCodeInfo({
							key: LEGACY_CLOUD_BACKUP_MESSAGE_KEYS.codeInfoFailed,
							kind: 'message',
						});
					}
				});
		},
		[]
	);

	useEffect(() => {
		updateCloudCodeInfo(currentCloudCode);

		return () => {
			cloudCodeInfoRequestIdRef.current += 1;
		};
	}, [currentCloudCode, updateCloudCodeInfo]);

	const handleCloudDeleteButtonPress = useCallback(() => {
		const normalizedCode = currentCloudCode?.trim() ?? '';
		if (normalizedCode === '') {
			return;
		}

		setIsCloudDeleteButtonDisabled(true);
		setCloudDeleteButtonLabel({
			key: LEGACY_CLOUD_DELETE_BUTTON_LABEL_KEYS.deleting,
		});

		deleteLegacyBackup(normalizedCode)
			.then(() => {
				setCloudDeleteState('success');
				setCloudDeleteButtonLabel({
					key: LEGACY_CLOUD_DELETE_BUTTON_LABEL_KEYS.success,
				});
				globalStore.persistence.cloudCode.set(null);
				trackEvent(
					trackEvent.category.click,
					'Cloud Delete Button',
					normalizedCode
				);
			})
			.catch((error: unknown) => {
				setErrorState({
					error,
					labelKey: LEGACY_CLOUD_DELETE_BUTTON_LABEL_KEYS.fail,
					setLabel: setCloudDeleteButtonLabel,
					setState: setCloudDeleteState,
					type: 'Delete',
				});
			})
			.finally(() => {
				const timerId = setTimeout(() => {
					setCloudDeleteState('default');
					setIsCloudDeleteButtonDisabled(false);
					setCloudDeleteButtonLabel({
						key: LEGACY_CLOUD_DELETE_BUTTON_LABEL_KEYS.delete,
					});
					cloudTimers.current = cloudTimers.current.filter(
						(id) => id !== timerId
					);
				}, 3000);
				cloudTimers.current.push(timerId);
			});
	}, [currentCloudCode]);

	const handleCloudDownloadButtonPress = useCallback(() => {
		const currentNormalizedCode = currentCloudCode?.trim() ?? '';
		const code =
			(currentNormalizedCode === ''
				? prompt(t('preferences.cloud.promptCode'))
				: currentNormalizedCode
			)?.trim() ?? '';

		if (code === '') {
			return;
		}

		setIsCloudDownloadButtonDisabled(true);
		setCloudDownloadButtonLabel({
			key: LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_KEYS.downloading,
		});
		let didDownload = false;

		downloadLegacyBackup<unknown>(code)
			.then((data) => {
				const importedData = parseGuestDataImport(data).data;
				if (importedData.customer_normal_meals !== undefined) {
					normalGuestStore.persistence.meals.set(
						importedData.customer_normal_meals
					);
				}
				if (importedData.customer_rare_meals !== undefined) {
					specialGuestStore.persistence.meals.set(
						importedData.customer_rare_meals
					);
				}

				setCloudDownloadState('success');
				setCloudDownloadButtonLabel({
					key: LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_KEYS.success,
				});
				globalStore.persistence.cloudCode.set(code);
				didDownload = true;
				trackEvent(
					trackEvent.category.click,
					'Cloud Download Button',
					code
				);
			})
			.catch((error: unknown) => {
				setErrorState({
					error,
					labelKey: LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_KEYS.fail,
					setLabel: setCloudDownloadButtonLabel,
					setState: setCloudDownloadState,
					type: 'Download',
				});
			})
			.finally(() => {
				const latestCloudCode =
					globalStore.persistence.cloudCode.get()?.trim() ?? '';
				if (didDownload || code === latestCloudCode) {
					updateCloudCodeInfo(code);
				}
				const timerId = setTimeout(() => {
					setCloudDownloadState('default');
					setIsCloudDownloadButtonDisabled(false);
					setCloudDownloadButtonLabel({
						key: LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_KEYS.download,
					});
					cloudTimers.current = cloudTimers.current.filter(
						(id) => id !== timerId
					);
				}, 3000);
				cloudTimers.current.push(timerId);
			});
	}, [currentCloudCode, t, updateCloudCodeInfo]);

	const handleCloudUploadButtonPress = useCallback(() => {
		setIsCloudUploadButtonDisabled(true);
		setCloudUploadButtonLabel({
			key: LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_KEYS.uploading,
		});

		let cloudCodeToRefresh = currentCloudCode;
		const cloudCode = currentCloudCode?.trim();

		uploadLegacyBackup({
			code: cloudCode === '' ? null : (cloudCode ?? null),
			data: currentMealData,
			user_id: userId,
		})
			.then(({ code }) => {
				cloudCodeToRefresh = code;
				setCloudUploadState('success');
				setCloudUploadButtonLabel({
					key: LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_KEYS.success,
				});
				globalStore.persistence.cloudCode.set(code);
				trackEvent(
					trackEvent.category.click,
					'Cloud Upload Button',
					code
				);
			})
			.catch((error: unknown) => {
				setErrorState({
					error,
					labelKey: LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_KEYS.fail,
					setLabel: setCloudUploadButtonLabel,
					setState: setCloudUploadState,
					type: 'Upload',
				});
			})
			.finally(() => {
				updateCloudCodeInfo(cloudCodeToRefresh);
				const timerId = setTimeout(() => {
					setCloudUploadState('default');
					setIsCloudUploadButtonDisabled(false);
					setCloudUploadButtonLabel({
						key: LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_KEYS.upload,
					});
					cloudTimers.current = cloudTimers.current.filter(
						(id) => id !== timerId
					);
				}, 3000);
				cloudTimers.current.push(timerId);
			});
	}, [currentCloudCode, currentMealData, updateCloudCodeInfo, userId]);

	const cloudCodeTooltipProps = useMemo(
		() => ({
			content: t('preferences.cloud.copyTip'),
			delay: 0,
			offset: 0,
			size: 'sm' as const,
		}),
		[t]
	);

	return (
		<>
			<p className="-mt-1 text-small text-foreground-500">
				{t('preferences.cloud.currentCode')}
				{isCloudCodeValid && (
					<Popover shouldCloseOnScroll showArrow>
						<PopoverTrigger>
							<Button
								isDisabled={!isCloudCodeValid}
								variant="light"
								className="-ml-1 inline-block h-auto w-auto min-w-0 p-1 leading-none text-foreground-500"
							>
								{t('preferences.cloud.viewCode')}
							</Button>
						</PopoverTrigger>
						<PopoverContent>
							<Snippet
								size="sm"
								symbol={
									<FontAwesomeIcon
										icon={faKey}
										className="mr-1 !align-middle text-default-700"
									/>
								}
								tooltipProps={cloudCodeTooltipProps}
								classNames={CLOUD_CODE_CLASS_NAMES}
							>
								{currentCloudCode}
							</Snippet>
						</PopoverContent>
					</Popover>
				)}
				{cloudCodeInfo !== null &&
					(cloudCodeInfo.kind === 'empty' ? (
						<>
							{t('preferences.cloud.none')}
							<span className="text-tiny">
								{t('preferences.cloud.autoGenerateNote')}
							</span>
						</>
					) : cloudCodeInfo.kind === 'meta' ? (
						<span className="text-tiny">
							{t('preferences.cloud.updatedAt')}
							<TimeAgo timestamp={cloudCodeInfo.createdAt} />
							{t('preferences.cloud.separator')}
							{cloudCodeInfo.lastAccessed === -1 ? (
								t('preferences.cloud.neverDownloaded')
							) : (
								<>
									{t('preferences.cloud.downloadedAt')}
									<TimeAgo
										timestamp={cloudCodeInfo.lastAccessed}
									/>
								</>
							)}
							{t('preferences.cloud.closeParen')}
						</span>
					) : (
						<span className="text-tiny">
							{t('preferences.cloud.format.parens', {
								message: t(
									cloudCodeInfo.key,
									cloudCodeInfo.params
								),
							})}
						</span>
					))}
			</p>
			<p className="mb-2 mt-0.5 text-tiny text-foreground-500">
				{t('preferences.cloud.codeValidity')}
			</p>
			<div className="w-full space-y-2 lg:w-1/2">
				<Button
					fullWidth
					color={
						isCloudUploadButtonDisabled
							? cloudUploadState
							: 'primary'
					}
					isDisabled={isCloudDoing}
					isLoading={isCloudUploadButtonDisabled}
					variant="flat"
					onPress={handleCloudUploadButtonPress}
				>
					{renderLabel(cloudUploadButtonLabel)}
				</Button>
				<Button
					fullWidth
					color={
						isCloudDownloadButtonDisabled
							? cloudDownloadState
							: 'primary'
					}
					isDisabled={isCloudDoing}
					isLoading={isCloudDownloadButtonDisabled}
					variant="flat"
					onPress={handleCloudDownloadButtonPress}
				>
					{renderLabel(cloudDownloadButtonLabel)}
				</Button>
				<Button
					fullWidth
					color={
						isCloudDeleteButtonDisabled
							? cloudDeleteState
							: 'primary'
					}
					isDisabled={isCloudDoing || !isCloudCodeValid}
					isLoading={isCloudDeleteButtonDisabled}
					variant="flat"
					onPress={handleCloudDeleteButtonPress}
				>
					{renderLabel(cloudDeleteButtonLabel)}
				</Button>
			</div>
		</>
	);
});
