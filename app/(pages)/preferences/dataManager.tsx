import {
	type ChangeEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react';
import { debounce, isObject } from 'lodash';

import { useProgress } from 'react-transition-progress';
import { usePathname, useThrottle } from '@/hooks';

import { Textarea } from '@heroui/input';
import { Tab, Tabs } from '@heroui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Snippet,
	Tooltip,
	cn,
} from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import { showProgress } from '@/(pages)/(layout)/navbar';
import { trackEvent } from '@/components/analytics';
import {
	customerRareTutorialPathname,
	customerRareTutorialResetLabel,
	customerRareTutorialStoreKey,
} from '@/components/customerRareTutorial';
import Heading from '@/components/heading';
import TimeAgo from '@/components/timeAgo';

import LegacyBackupImport from '@/lib/account/client/components/legacyBackupImport';
import {
	LEGACY_BACKUP_FREQUENCY_TTL,
	deleteLegacyBackup,
	downloadLegacyBackup,
	fetchLegacyBackupMetadata,
	uploadLegacyBackup,
} from '@/lib/account/client/legacyBackups';
import {
	validateCustomerNormalMealsData,
	validateCustomerRareMealsData,
	validateCustomerRarePlansData,
} from '@/lib/account/sync/validation';

import {
	compatibilityCustomerRareData,
	deleteIndexProperty,
} from '@/actions/backup/compatibility';
import { siteConfig } from '@/configs';
import {
	accountStore,
	customerNormalStore,
	customerRareStore,
	globalStore,
} from '@/stores';
import {
	FILE_TYPE_JSON,
	checkA11yConfirmKey,
	downloadJson,
	parseJsonFromInput,
	toggleBoolean,
} from '@/utilities';

const { isAccountFeatureClientEnabled } = siteConfig;

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

const exportButtonLabelMap = {
	download: '导出',
	downloading: '尝试唤起下载器',
	downloadingTip: '如无响应，请检查浏览器权限、设置和浏览器扩展程序',
} as const;

function getClosestModalScrollContainer(element: HTMLElement | null) {
	const dialogElement = element?.closest('[role="dialog"]');

	if (element === null || dialogElement === null) {
		return null;
	}

	let currentElement = element.parentElement;

	while (currentElement !== null && currentElement !== dialogElement) {
		const { overflowY } = globalThis.getComputedStyle(currentElement);

		if (
			['auto', 'overlay', 'scroll'].includes(overflowY) &&
			currentElement.scrollHeight > currentElement.clientHeight
		) {
			return currentElement;
		}

		currentElement = currentElement.parentElement;
	}

	return null;
}

type TCloudState = 'danger' | 'default' | 'success';
type TExportButtonLabel = ExtractCollectionValue<typeof exportButtonLabelMap>;
type TResetTarget = 'meals' | 'plans';

const CUSTOMER_DATA_KEY_MAP = {
	normalMeals: 'customer_normal_meals',
	rareMeals: 'customer_rare_meals',
	rarePlans: 'customer_rare_plans',
} as const;

const LEGACY_CUSTOMER_DATA_KEY_MAP = {
	normalMeals: 'customer_normal',
	rareMeals: 'customer_rare',
} as const;

const CUSTOMER_DATA_KEY_SET = new Set<string>(
	Object.values(CUSTOMER_DATA_KEY_MAP)
);
const LEGACY_CUSTOMER_DATA_KEY_SET = new Set<string>(
	Object.values(LEGACY_CUSTOMER_DATA_KEY_MAP)
);

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
		console.error(error);
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

interface IProps {
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function DataManager({ onModalClose }) {
	const { pathname } = usePathname();
	const startProgress = useProgress();
	const isReducedMotion = useReducedMotion();

	const currentNormalMealData = customerNormalStore.persistence.meals.use();
	const currentRareMealData = customerRareStore.persistence.meals.use();
	const currentRarePlanData = customerRareStore.persistence.plans.use();

	const currentMealData = useMemo(
		() => ({
			customer_normal: currentNormalMealData,
			customer_rare: currentRareMealData,
		}),
		[currentNormalMealData, currentRareMealData]
	);

	const currentCustomerData = useMemo(
		() => ({
			[CUSTOMER_DATA_KEY_MAP.normalMeals]: currentNormalMealData,
			[CUSTOMER_DATA_KEY_MAP.rareMeals]: currentRareMealData,
			[CUSTOMER_DATA_KEY_MAP.rarePlans]: currentRarePlanData,
		}),
		[currentNormalMealData, currentRareMealData, currentRarePlanData]
	);

	// For compatibility with older versions
	type TMealData = typeof currentMealData | typeof currentRareMealData;
	type TCustomerData = Partial<typeof currentCustomerData>;
	interface IImportData {
		data: TCustomerData;
		eventLabel: 'Customer Data' | 'Customer Rare Data';
	}

	const currentCustomerDataString = useMemo(
		() => JSON.stringify(currentCustomerData, null, '\t'),
		[currentCustomerData]
	);

	const [importValue, setImportValue] = useState('');
	const importValueRef = useRef(importValue);
	importValueRef.current = importValue;
	const throttledImportValue = useThrottle(importValue);
	const [importData, setImportData] = useState<IImportData | null>(null);
	const [importReadError, setImportReadError] = useState(false);
	const importReadRequestIdRef = useRef(0);
	const importInputRef = useRef<HTMLInputElement | null>(null);

	const [isExportButtonDisabled, setIsExportButtonDisabled] = useState(false);
	const [exportButtonLabel, setExportButtonLabel] =
		useState<TExportButtonLabel>(exportButtonLabelMap.download);

	const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
	const [isSaveButtonError, setIsSaveButtonError] = useState(false);
	const [isSaveButtonLoading, setIsSaveButtonLoading] = useState(false);
	const [isSavePopoverOpened, toggleSavePopoverOpened] = useReducer(
		toggleBoolean,
		false
	);
	const [resetTarget, setResetTarget] = useState<TResetTarget | null>(null);
	const isResetPopoverOpened = resetTarget !== null;

	const shouldLockDataManagerScroll =
		isSavePopoverOpened || isResetPopoverOpened;
	const dataManagerRef = useRef<HTMLDivElement | null>(null);

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
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const userId = globalStore.persistence.userId.use();

	const isCloudCodeValid = (currentCloudCode?.trim() ?? '').length > 0;

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();

	const shouldShowLegacyCloud =
		isAccountFeatureClientEnabled &&
		(accountBootstrapStatus === 'disabled' ||
			accountBootstrapStatus === 'error');
	const shouldShowLegacyBackupImport =
		isAccountFeatureClientEnabled &&
		(accountBootstrapStatus === 'anonymous' ||
			accountBootstrapStatus === 'loggedIn');

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
		if (!shouldShowLegacyCloud) {
			cloudCodeInfoRequestIdRef.current += 1;
			setCloudCodeInfo(null);
			return;
		}

		updateCloudCodeInfo(currentCloudCode);
	}, [currentCloudCode, shouldShowLegacyCloud, updateCloudCodeInfo]);

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

		downloadLegacyBackup<TMealData>(code)
			.then((data) => {
				setCloudDownloadState('success');
				setCloudDownloadButtonLabel(
					cloudDownloadButtonLabelMap.success
				);
				if ('customer_normal' in data) {
					deleteIndexProperty(data.customer_normal);
					deleteIndexProperty(data.customer_rare);
					customerNormalStore.persistence.meals.set(
						data.customer_normal
					);
					customerRareStore.persistence.meals.set(data.customer_rare);
				} else {
					deleteIndexProperty(data);
					compatibilityCustomerRareData(data);
					customerRareStore.persistence.meals.set(data);
				}
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

	const handleExportButtonPress = useCallback(() => {
		setIsExportButtonDisabled(true);
		setExportButtonLabel(exportButtonLabelMap.downloading);
		const timerId = setTimeout(() => {
			setIsExportButtonDisabled(false);
			setExportButtonLabel(exportButtonLabelMap.download);
			cloudTimers.current = cloudTimers.current.filter(
				(id) => id !== timerId
			);
		}, 5000);
		cloudTimers.current.push(timerId);
		const fileName = `customer_data-${Object.keys(currentMealData.customer_normal).length}_${Object.keys(currentMealData.customer_rare).length}_${currentRarePlanData.items.length}-${Date.now()}`;
		downloadJson(fileName, currentCustomerDataString);
		trackEvent(trackEvent.category.click, 'Export Button', fileName);
	}, [currentCustomerDataString, currentMealData, currentRarePlanData]);

	const handleImportData = useCallback(() => {
		toggleSavePopoverOpened();
		if (importData !== null) {
			const { data, eventLabel } = importData;
			if (data.customer_normal_meals !== undefined) {
				customerNormalStore.persistence.meals.set(
					data.customer_normal_meals
				);
			}
			if (data.customer_rare_meals !== undefined) {
				customerRareStore.persistence.meals.set(
					data.customer_rare_meals
				);
			}
			if (data.customer_rare_plans !== undefined) {
				customerRareStore.persistence.plans.set(
					data.customer_rare_plans
				);
			}
			trackEvent(trackEvent.category.click, 'Import Button', eventLabel);
		}
	}, [importData]);

	const handleResetMealData = useCallback(() => {
		setResetTarget(null);
		customerNormalStore.persistence.meals.set({});
		customerRareStore.persistence.meals.set({});
		trackEvent(trackEvent.category.click, 'Reset Button', 'Customer Data');
	}, []);

	const handleResetPlanData = useCallback(() => {
		setResetTarget(null);
		customerRareStore.persistence.plans.set({ activeId: null, items: [] });
		trackEvent(
			trackEvent.category.click,
			'Reset Button',
			'Customer Rare Plans'
		);
	}, []);

	const handleImportButtonPress = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Import Button',
			'Select Customer Data File'
		);
		importInputRef.current?.click();
	}, []);

	const handleImportInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const { target } = event;
			const requestId = ++importReadRequestIdRef.current;
			setImportReadError(false);
			setIsSaveButtonLoading(true);
			void parseJsonFromInput(target)
				.then((text) => {
					if (importReadRequestIdRef.current !== requestId) {
						return;
					}
					if (text === null || text === importValueRef.current) {
						setIsSaveButtonLoading(false);
						return;
					}
					setImportValue(text);
				})
				.catch(() => {
					if (importReadRequestIdRef.current !== requestId) {
						return;
					}
					setImportValue('');
					setImportReadError(true);
				})
				.finally(() => {
					target.value = '';
				});
		},
		[]
	);

	const handleImportValueChange = useCallback((value: string) => {
		importReadRequestIdRef.current += 1;
		setImportReadError(false);
		setImportValue(value);
	}, []);

	useEffect(() => {
		if (importReadError) {
			setImportData(null);
			setIsSaveButtonDisabled(true);
			setIsSaveButtonError(true);
			setIsSaveButtonLoading(false);
			return;
		}

		const hasValue = Boolean(throttledImportValue);
		try {
			setImportData(null);
			if (!hasValue) {
				setIsSaveButtonError(false);
			}
			setIsSaveButtonLoading(true);
			const json: unknown = JSON.parse(throttledImportValue);
			if (Array.isArray(json) || !isObject(json)) {
				throw new TypeError('not an object');
			}

			const keys = Object.keys(json);
			const hasCurrentCustomerDataKey = keys.some((key) =>
				CUSTOMER_DATA_KEY_SET.has(key)
			);
			const hasLegacyCustomerDataKey = keys.some((key) =>
				LEGACY_CUSTOMER_DATA_KEY_SET.has(key)
			);

			if (hasCurrentCustomerDataKey && hasLegacyCustomerDataKey) {
				throw new TypeError('mixed current and legacy customer data');
			}

			if (hasCurrentCustomerDataKey) {
				if (!keys.every((key) => CUSTOMER_DATA_KEY_SET.has(key))) {
					throw new TypeError('invalid combined meal data');
				}

				const data = json as Record<string, unknown>;
				if (CUSTOMER_DATA_KEY_MAP.normalMeals in data) {
					const normalData = data[
						CUSTOMER_DATA_KEY_MAP.normalMeals
					] as Record<string, object[]>;
					deleteIndexProperty(normalData);
					if (!validateCustomerNormalMealsData(normalData)) {
						throw new TypeError('invalid normal meal data');
					}
				}
				if (CUSTOMER_DATA_KEY_MAP.rareMeals in data) {
					const rareData = data[
						CUSTOMER_DATA_KEY_MAP.rareMeals
					] as Record<string, object[]>;
					deleteIndexProperty(rareData);
					if (!validateCustomerRareMealsData(rareData)) {
						throw new TypeError('invalid rare meal data');
					}
				}
				if (
					CUSTOMER_DATA_KEY_MAP.rarePlans in data &&
					!validateCustomerRarePlansData(
						data[CUSTOMER_DATA_KEY_MAP.rarePlans]
					)
				) {
					throw new TypeError('invalid customer rare plans');
				}

				setImportData({ data, eventLabel: 'Customer Data' });
			} else if (hasLegacyCustomerDataKey) {
				if (
					!keys.every((key) => LEGACY_CUSTOMER_DATA_KEY_SET.has(key))
				) {
					throw new TypeError('invalid legacy combined meal data');
				}

				const legacyData = json as Record<string, unknown>;
				const data: TCustomerData = {};
				if (LEGACY_CUSTOMER_DATA_KEY_MAP.normalMeals in legacyData) {
					const normalData = legacyData[
						LEGACY_CUSTOMER_DATA_KEY_MAP.normalMeals
					] as Record<string, object[]>;
					deleteIndexProperty(normalData);
					if (!validateCustomerNormalMealsData(normalData)) {
						throw new TypeError('invalid legacy normal meal data');
					}
					data.customer_normal_meals = normalData;
				}
				if (LEGACY_CUSTOMER_DATA_KEY_MAP.rareMeals in legacyData) {
					const rareData = legacyData[
						LEGACY_CUSTOMER_DATA_KEY_MAP.rareMeals
					] as Record<string, object[]>;
					deleteIndexProperty(rareData);
					if (!validateCustomerRareMealsData(rareData)) {
						throw new TypeError('invalid legacy rare meal data');
					}
					data.customer_rare_meals = rareData;
				}

				setImportData({ data, eventLabel: 'Customer Data' });
			} else {
				const rareData = json as Record<string, object[]>;
				deleteIndexProperty(rareData);
				compatibilityCustomerRareData(rareData);
				if (!validateCustomerRareMealsData(rareData)) {
					throw new TypeError('invalid legacy meal data');
				}
				setImportData({
					data: { customer_rare_meals: rareData },
					eventLabel: 'Customer Rare Data',
				});
			}

			setIsSaveButtonDisabled(false);
			setIsSaveButtonError(false);
			setIsSaveButtonLoading(false);
		} catch {
			setIsSaveButtonDisabled(true);
			if (hasValue) {
				setIsSaveButtonError(true);
			}
			setIsSaveButtonLoading(false);
		}
	}, [importReadError, throttledImportValue]);

	useEffect(() => {
		if (!shouldLockDataManagerScroll) {
			return;
		}

		const container = getClosestModalScrollContainer(
			dataManagerRef.current
		);

		if (container === null) {
			return;
		}

		const previousOverflowY = container.style.overflowY;
		container.style.overflowY = 'hidden';

		return () => {
			container.style.overflowY = previousOverflowY;
		};
	}, [shouldLockDataManagerScroll]);

	return (
		<div ref={dataManagerRef}>
			<Heading subTitle="备份/还原/重置顾客套餐和营业预设数据">
				数据管理
			</Heading>
			<div className="-mt-2">
				<Tabs
					defaultSelectedKey="reset"
					destroyInactiveTabPanel={false}
					disableAnimation={isReducedMotion}
					isDisabled={isResetPopoverOpened}
					variant="underlined"
					onSelectionChange={() => {
						importReadRequestIdRef.current += 1;
						setImportReadError(false);
						setImportValue('');
					}}
					aria-label="数据管理选项卡"
					classNames={{ base: '-ml-3' }}
				>
					<Tab key="backup-local" title="本地导入/导出">
						<div className="w-full space-y-4">
							<div className="w-full space-y-2 lg:w-1/2">
								<Textarea
									isClearable
									disableAnimation={isReducedMotion}
									placeholder="从本地文件导入或输入顾客套餐和营业预设数据"
									value={importValue}
									onValueChange={handleImportValueChange}
									classNames={{
										inputWrapper: cn(
											'bg-default/40 transition-background data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default motion-reduce:transition-none',
											{
												'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70':
													isHighAppearance,
											}
										),
									}}
								/>
								<input
									accept={FILE_TYPE_JSON}
									type="file"
									onChange={handleImportInputChange}
									className="hidden"
									ref={importInputRef}
								/>
								<Button
									fullWidth
									color="primary"
									variant="flat"
									onPress={handleImportButtonPress}
								>
									选择本地文件
								</Button>
								<Popover
									shouldBlockScroll
									showArrow
									isOpen={isSavePopoverOpened}
								>
									<PopoverTrigger>
										<Button
											fullWidth
											color={
												isSaveButtonError
													? 'danger'
													: 'primary'
											}
											isDisabled={isSaveButtonDisabled}
											isLoading={isSaveButtonLoading}
											variant="flat"
											onClick={toggleSavePopoverOpened}
											onKeyDown={debounce(
												checkA11yConfirmKey(
													toggleSavePopoverOpened
												)
											)}
										>
											应用到本设备
										</Button>
									</PopoverTrigger>
									<PopoverContent className="space-y-1 p-1">
										<Button
											fullWidth
											color="danger"
											size="sm"
											variant="ghost"
											onPress={handleImportData}
										>
											确认应用
										</Button>
										<Button
											fullWidth
											color="primary"
											size="sm"
											variant="ghost"
											onPress={toggleSavePopoverOpened}
										>
											取消
										</Button>
									</PopoverContent>
								</Popover>
							</div>
							<div className="w-full space-y-2 lg:w-1/2">
								<Snippet
									hideSymbol
									fullWidth
									tooltipProps={{
										content:
											'点击以复制当前的顾客套餐和营业预设数据',
										delay: 0,
										offset: 0,
										showArrow: !isHighAppearance,
									}}
									variant="flat"
									classNames={{
										base: cn({
											'bg-default/40 backdrop-blur':
												isHighAppearance,
										}),
										pre: 'max-h-[13.25rem] w-full overflow-auto whitespace-pre-wrap',
									}}
								>
									{currentCustomerDataString}
								</Snippet>
								<Tooltip
									isOpen
									showArrow
									color="success"
									content={
										exportButtonLabelMap.downloadingTip
									}
									isDisabled={!isExportButtonDisabled}
								>
									<Button
										fullWidth
										color={
											isExportButtonDisabled
												? 'success'
												: 'primary'
										}
										isDisabled={isExportButtonDisabled}
										isLoading={isExportButtonDisabled}
										variant="flat"
										onPress={handleExportButtonPress}
									>
										{exportButtonLabel}
									</Button>
								</Tooltip>
							</div>
						</div>
					</Tab>
					{shouldShowLegacyBackupImport && (
						<Tab key="legacy-backup-import" title="旧备份码导入">
							<div className="w-full space-y-2 lg:w-1/2">
								<LegacyBackupImport />
							</div>
						</Tab>
					)}
					{shouldShowLegacyCloud && (
						<Tab key="backup-cloud" title="云端备份/还原">
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
									isDisabled={
										isCloudDoing || !isCloudCodeValid
									}
									isLoading={isCloudDeleteButtonDisabled}
									variant="flat"
									onPress={handleCloudDeleteButtonPress}
								>
									{cloudDeleteButtonLabel}
								</Button>
							</div>
						</Tab>
					)}
					<Tab key="reset" title="重置">
						<div className="w-full space-y-2 lg:w-1/2">
							<Popover
								shouldBlockScroll
								showArrow
								isOpen={resetTarget === 'meals'}
							>
								<PopoverTrigger>
									<Button
										fullWidth
										color="danger"
										variant="flat"
										onClick={() => {
											setResetTarget((current) =>
												current === 'meals'
													? null
													: 'meals'
											);
										}}
										onKeyDown={debounce(
											checkA11yConfirmKey(() => {
												setResetTarget((current) =>
													current === 'meals'
														? null
														: 'meals'
												);
											})
										)}
									>
										重置已保存的顾客套餐数据
									</Button>
								</PopoverTrigger>
								<PopoverContent className="space-y-1 p-1">
									<Button
										fullWidth
										color="danger"
										size="sm"
										variant="ghost"
										onPress={handleResetMealData}
									>
										确认重置
									</Button>
									<Button
										fullWidth
										color="primary"
										size="sm"
										variant="ghost"
										onPress={() => {
											setResetTarget(null);
										}}
									>
										取消重置
									</Button>
								</PopoverContent>
							</Popover>
							<Popover
								shouldBlockScroll
								showArrow
								isOpen={resetTarget === 'plans'}
							>
								<PopoverTrigger>
									<Button
										fullWidth
										color="danger"
										variant="flat"
										onClick={() => {
											setResetTarget((current) =>
												current === 'plans'
													? null
													: 'plans'
											);
										}}
										onKeyDown={debounce(
											checkA11yConfirmKey(() => {
												setResetTarget((current) =>
													current === 'plans'
														? null
														: 'plans'
												);
											})
										)}
									>
										重置已保存的营业预设数据
									</Button>
								</PopoverTrigger>
								<PopoverContent className="space-y-1 p-1">
									<Button
										fullWidth
										color="danger"
										size="sm"
										variant="ghost"
										onPress={handleResetPlanData}
									>
										确认重置
									</Button>
									<Button
										fullWidth
										color="primary"
										size="sm"
										variant="ghost"
										onPress={() => {
											setResetTarget(null);
										}}
									>
										取消重置
									</Button>
								</PopoverContent>
							</Popover>
							<Button
								fullWidth
								color="primary"
								variant="flat"
								onPress={() => {
									showProgress(startProgress);
									customerRareStore.persistence.customer.filters.set(
										(prev) => {
											Object.keys(prev).forEach((key) => {
												prev[key as keyof typeof prev] =
													[];
											});
										}
									);
									customerRareStore.persistence.customer.orderLinkedFilter.set(
										true
									);
									customerRareStore.persistence.recipe.table.cookers.set(
										[]
									);
									customerRareStore.persistence.recipe.table.availabilityDlcs.set(
										[]
									);
									customerRareStore.persistence.recipe.table.sortDescriptor.set(
										{}
									);
									customerRareStore.persistence.beverage.table.availabilityDlcs.set(
										[]
									);
									customerRareStore.persistence.beverage.table.sortDescriptor.set(
										{}
									);
									customerRareStore.persistence.ingredient.filters.set(
										(prev) => {
											Object.keys(prev).forEach((key) => {
												prev[key as keyof typeof prev] =
													[];
											});
										}
									);
									globalStore.persistence.set((prev) => {
										const dirver = prev.dirver.filter(
											(item) =>
												item !==
												customerRareTutorialStoreKey
										);
										prev.dirver = dirver;
									});
									// Wait for the button animation to complete (the animate will take 800ms).
									setTimeout(
										() => {
											onModalClose?.();
											// Wait for the modal to close (the animate will take 300ms).
											setTimeout(
												() => {
													if (
														pathname ===
														customerRareTutorialPathname
													) {
														location.reload();
													} else {
														location.href =
															customerRareTutorialPathname;
													}
												},
												isReducedMotion ? 0 : 300
											);
										},
										isReducedMotion ? 0 : 800
									);
									trackEvent(
										trackEvent.category.click,
										'Reset Button',
										'Customer Rare Tutorial'
									);
								}}
							>
								{customerRareTutorialResetLabel}
							</Button>
						</div>
					</Tab>
				</Tabs>
			</div>
		</div>
	);
});

export type { IProps as IDataManagerProps };
