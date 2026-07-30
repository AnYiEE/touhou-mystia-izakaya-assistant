import { faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isObject } from 'lodash';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Snippet from '@/design/ui/components/snippet';
import TimeAgo from '@/design/ui/components/timeAgo';

import { customerNormalMealsSerializer } from '@/features/account/sync/serializers/customerNormalMeals';
import { customerRareMealsSerializer } from '@/features/account/sync/serializers/customerRareMeals';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useAnonymousVisitorId } from '@/features/analytics/client/visitorIdentity';
import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import {
	LEGACY_BACKUP_FREQUENCY_TTL,
	deleteLegacyBackup,
	downloadLegacyBackup,
	fetchLegacyBackupMetadata,
	uploadLegacyBackup,
} from '@/features/legacyBackup/client/api';
import {
	compatibilityCustomerRareData,
	deleteIndexProperty,
} from '@/features/legacyBackup/legacyPayload';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

const cloudDeleteButtonLabelMap = {
	delete: '删除云备份',
	deleting: '正在删除数据',
	fail: '删除失败',
	success: '删除成功',
} as const;

const cloudDownloadButtonLabelMap = {
	download: '还原云备份',
	downloading: '正在获取数据',
	fail: '还原失败',
	success: '还原成功',
} as const;

const cloudUploadButtonLabelMap = {
	fail: '上传失败',
	success: '上传成功',
	upload: '备份至云端',
	uploading: '正在上传数据',
} as const;

type TCloudState = 'danger' | 'default' | 'success';

function setErrorState({
	error,
	label,
	setLabel,
	setState,
	type,
}: {
	error: unknown;
	label: string;
	setLabel: (label: string) => void;
	setState: (state: TCloudState) => void;
	type: 'Delete' | 'Download' | 'Upload';
}) {
	setState('danger');
	if (error instanceof Error) {
		console.error({ errorCode: getLogSafeErrorCode(error) });
		setLabel(`${label}（网络错误）`);
		trackEvent(trackEvent.category.error, 'Cloud', type, error.message);
	} else {
		const {
			data: { message },
			status,
		} = error as { data: { message: string }; status: number };
		console.error({ message, status });
		const errorMessage =
			status === 400
				? '无效的备份码'
				: status === 404
					? '目标文件不存在'
					: status === 409
						? '备份正在处理中，请稍后重试'
						: status === 429
							? `请${LEGACY_BACKUP_FREQUENCY_TTL / 1000 / 60}分钟后再试`
							: status;
		setLabel(`${label}（${errorMessage}）`);
		if (type === 'Delete' && status === 404) {
			globalStore.persistence.cloudCode.set(null);
		}
		trackEvent(trackEvent.category.error, 'Cloud', type, status);
	}
}

export default memo(function CloudBackupPanel() {
	const currentNormalMealData = customerNormalStore.persistence.meals.use();
	const currentRareMealData = customerRareStore.persistence.meals.use();

	const currentMealData = useMemo(
		() => ({
			customer_normal: currentNormalMealData,
			customer_rare: currentRareMealData,
		}),
		[currentNormalMealData, currentRareMealData]
	);

	type TLegacyMealData =
		| {
				customer_normal: Record<string, object[]>;
				customer_rare: Record<string, object[]>;
		  }
		| Record<string, object[]>;

	const [isCloudDeleteButtonDisabled, setIsCloudDeleteButtonDisabled] =
		useState(false);
	const [cloudDeleteButtonLabel, setCloudDeleteButtonLabel] = useState(
		cloudDeleteButtonLabelMap.delete as string
	);
	const [cloudDeleteState, setCloudDeleteState] =
		useState<TCloudState>('default');

	const [isCloudDownloadButtonDisabled, setIsCloudDownloadButtonDisabled] =
		useState(false);
	const [cloudDownloadButtonLabel, setCloudDownloadButtonLabel] = useState(
		cloudDownloadButtonLabelMap.download as string
	);
	const [cloudDownloadState, setCloudDownloadState] =
		useState<TCloudState>('default');

	const [isCloudUploadButtonDisabled, setIsCloudUploadButtonDisabled] =
		useState(false);
	const [cloudUploadButtonLabel, setCloudUploadButtonLabel] = useState(
		cloudUploadButtonLabelMap.upload as string
	);
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

	const [cloudCodeInfo, setCloudCodeInfo] =
		useState<ReactNodeWithoutBoolean>(null);
	const cloudCodeInfoRequestIdRef = useRef(0);

	const updateCloudCodeInfo = useCallback(
		(cloudCode: typeof currentCloudCode) => {
			cloudCodeInfoRequestIdRef.current += 1;

			const requestId = cloudCodeInfoRequestIdRef.current;
			const normalizedCode = cloudCode?.trim() ?? null;

			if (normalizedCode === null || normalizedCode === '') {
				setCloudCodeInfo(
					<>
						无
						<span className="text-tiny">
							（下次备份时将自动生成，请自行保存至他处）
						</span>
					</>
				);
				return;
			}
			fetchLegacyBackupMetadata(normalizedCode)
				.then(({ created_at, last_accessed }) => {
					if (cloudCodeInfoRequestIdRef.current !== requestId) {
						return;
					}

					setCloudCodeInfo(
						<span className="text-tiny">
							（更新于
							<TimeAgo timestamp={created_at} />，
							{last_accessed === -1 ? (
								'尚未被下载过'
							) : (
								<>
									下载于
									<TimeAgo timestamp={last_accessed} />
								</>
							)}
							）
						</span>
					);
				})
				.catch((error: unknown) => {
					if (cloudCodeInfoRequestIdRef.current !== requestId) {
						return;
					}

					if (isObject(error) && 'status' in error) {
						const message =
							error.status === 404
								? '云端未记录此备份码，可能已于他处删除？'
								: error.status === 409
									? '备份正在处理中，请稍后重试'
									: error.status === 429
										? `请${LEGACY_BACKUP_FREQUENCY_TTL / 1000 / 60}分钟后再试`
										: '无效的备份码';
						setCloudCodeInfo(
							<span className="text-tiny">（{message}）</span>
						);
					} else {
						setCloudCodeInfo(
							<span className="text-tiny">
								（获取备份码信息失败）
							</span>
						);
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
		setCloudDeleteButtonLabel(cloudDeleteButtonLabelMap.deleting);

		deleteLegacyBackup(normalizedCode)
			.then(() => {
				setCloudDeleteState('success');
				setCloudDeleteButtonLabel(cloudDeleteButtonLabelMap.success);
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
					label: cloudDeleteButtonLabelMap.fail,
					setLabel: setCloudDeleteButtonLabel,
					setState: setCloudDeleteState,
					type: 'Delete',
				});
			})
			.finally(() => {
				const timerId = setTimeout(() => {
					setCloudDeleteState('default');
					setIsCloudDeleteButtonDisabled(false);
					setCloudDeleteButtonLabel(cloudDeleteButtonLabelMap.delete);
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
				? prompt('请输入已有备份码')
				: currentNormalizedCode
			)?.trim() ?? '';

		if (code === '') {
			return;
		}

		setIsCloudDownloadButtonDisabled(true);
		setCloudDownloadButtonLabel(cloudDownloadButtonLabelMap.downloading);
		let didDownload = false;

		downloadLegacyBackup<TLegacyMealData>(code)
			.then((data) => {
				if ('customer_normal' in data) {
					const combinedData = data as {
						customer_normal: Record<string, object[]>;
						customer_rare: Record<string, object[]>;
					};
					deleteIndexProperty(combinedData.customer_normal);
					deleteIndexProperty(combinedData.customer_rare);
					const normalMeals = customerNormalMealsSerializer.migrate(
						combinedData.customer_normal,
						1
					);
					const rareMeals = customerRareMealsSerializer.migrate(
						combinedData.customer_rare,
						1
					);
					customerNormalStore.persistence.meals.set(normalMeals);
					customerRareStore.persistence.meals.set(rareMeals);
				} else {
					deleteIndexProperty(data);
					compatibilityCustomerRareData(data);
					customerRareStore.persistence.meals.set(
						customerRareMealsSerializer.migrate(data, 1)
					);
				}

				setCloudDownloadState('success');
				setCloudDownloadButtonLabel(
					cloudDownloadButtonLabelMap.success
				);
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
					label: cloudDownloadButtonLabelMap.fail,
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
					setCloudDownloadButtonLabel(
						cloudDownloadButtonLabelMap.download
					);
					cloudTimers.current = cloudTimers.current.filter(
						(id) => id !== timerId
					);
				}, 3000);
				cloudTimers.current.push(timerId);
			});
	}, [currentCloudCode, updateCloudCodeInfo]);

	const handleCloudUploadButtonPress = useCallback(() => {
		setIsCloudUploadButtonDisabled(true);
		setCloudUploadButtonLabel(cloudUploadButtonLabelMap.uploading);

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
				setCloudUploadButtonLabel(cloudUploadButtonLabelMap.success);
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
					label: cloudUploadButtonLabelMap.fail,
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
					setCloudUploadButtonLabel(cloudUploadButtonLabelMap.upload);
					cloudTimers.current = cloudTimers.current.filter(
						(id) => id !== timerId
					);
				}, 3000);
				cloudTimers.current.push(timerId);
			});
	}, [currentCloudCode, currentMealData, updateCloudCodeInfo, userId]);

	return (
		<>
			<p className="-mt-1 text-small text-foreground-500">
				当前备份码：
				{isCloudCodeValid && (
					<Popover shouldCloseOnScroll showArrow>
						<PopoverTrigger>
							<Button
								isDisabled={!isCloudCodeValid}
								variant="light"
								className="-ml-1 inline-block h-auto w-auto min-w-0 p-1 leading-none text-foreground-500"
							>
								点此查看
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
								tooltipProps={{
									content: '点击以复制备份码',
									delay: 0,
									offset: 0,
									size: 'sm',
								}}
								classNames={{
									pre: 'flex max-w-screen-p-60 items-center whitespace-normal break-all',
								}}
							>
								{currentCloudCode}
							</Snippet>
						</PopoverContent>
					</Popover>
				)}
				{cloudCodeInfo}
			</p>
			<p className="mb-2 mt-0.5 text-tiny text-foreground-500">
				备份码有效期为180天，每次使用后会自动续期，逾期将自动失效
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
					{cloudUploadButtonLabel}
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
					{cloudDownloadButtonLabel}
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
					{cloudDeleteButtonLabel}
				</Button>
			</div>
		</>
	);
});
