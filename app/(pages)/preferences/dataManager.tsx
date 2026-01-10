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
	useReducedMotion,
} from '@/design/ui/components';

import { showProgress } from '@/(pages)/(layout)/navbar';
import { trackEvent } from '@/components/analytics';
import {
	customerRareTutorialPathname,
	customerRareTutorialResetLabel,
	customerRareTutorialStoreKey,
} from '@/components/customerRareTutorial';
import Heading from '@/components/heading';
import TimeAgo from '@/components/timeAgo';

import { FREQUENCY_TTL } from '@/api/backup/constant';
import type {
	IBackupCheckSuccessResponse,
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
} from '@/api/backup/types';
import { siteConfig } from '@/configs';
import { customerNormalStore, customerRareStore, globalStore } from '@/stores';
import {
	FILE_TYPE_JSON,
	checkA11yConfirmKey,
	downloadJson,
	parseJsonFromInput,
	toggleBoolean,
} from '@/utilities';

const { isOffline } = siteConfig;

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

type TCloudState = 'danger' | 'default' | 'success';
type TExportButtonLabel = ExtractCollectionValue<typeof exportButtonLabelMap>;

function checkResponse<T>(response: Response) {
	if (!response.ok) {
		return response.json().then((error) => {
			// eslint-disable-next-line @typescript-eslint/only-throw-error
			throw { data: error as object, status: response.status };
		});
	}

	return response.json() as Promise<T>;
}

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
		setLabel(
			`${label}（${status === 400 ? '无效的备份码' : status === 404 ? '目标文件不存在' : status === 429 ? `请${FREQUENCY_TTL / 1000 / 60}分钟后再试` : status}）`
		);
		if (type === 'Delete' && status === 404) {
			globalStore.persistence.cloudCode.set(null);
		}
		trackEvent(trackEvent.category.error, 'Cloud', type, status);
	}
}

function deleteIndexProperty(objects: Record<string, object[]>) {
	Object.values(objects).forEach((data) => {
		data.forEach((object) => {
			if ('index' in object) {
				delete object.index;
			}
		});
	});
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

	const currentMealData = useMemo(
		() => ({
			customer_normal: currentNormalMealData,
			customer_rare: currentRareMealData,
		}),
		[currentNormalMealData, currentRareMealData]
	);

	// For compatibility with older versions
	type TMealData = typeof currentMealData | typeof currentRareMealData;

	const currentMealDataString = useMemo(
		() => JSON.stringify(currentMealData, null, '\t'),
		[currentMealData]
	);

	const [importValue, setImportValue] = useState('');
	const throttledImportValue = useThrottle(importValue);
	const [importData, setImportData] = useState<TMealData | null>(null);
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
	const [isResetPopoverOpened, toggleResetPopoverOpened] = useReducer(
		toggleBoolean,
		false
	);

	const [isCloudDeleteButtonDisabled, setIsCloudDeleteButtonDisabled] =
		useState(false);
	const [cloudDeleteButtonLabel, setCloudDeleteButtonLabel] =
		useState<string>(cloudDeleteButtonLabelMap.delete);
	const [cloudDeleteState, setCloudDeleteState] =
		useState<TCloudState>('default');

	const [isCloudDownloadButtonDisabled, setIsCloudDownloadButtonDisabled] =
		useState(false);
	const [cloudDownloadButtonLabel, setCloudDownloadButtonLabel] =
		useState<string>(cloudDownloadButtonLabelMap.download);
	const [cloudDownloadState, setCloudDownloadState] =
		useState<TCloudState>('default');

	const [isCloudUploadButtonDisabled, setIsCloudUploadButtonDisabled] =
		useState(false);
	const [cloudUploadButtonLabel, setCloudUploadButtonLabel] =
		useState<string>(cloudUploadButtonLabelMap.upload);
	const [cloudUploadState, setCloudUploadState] =
		useState<TCloudState>('default');

	const isCloudDoing =
		isCloudDeleteButtonDisabled ||
		isCloudDownloadButtonDisabled ||
		isCloudUploadButtonDisabled;

	const currentCloudCode = globalStore.persistence.cloudCode.use();
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const userId = globalStore.persistence.userId.use();

	const isCloudCodeValid = currentCloudCode !== null;

	const [cloudCodeInfo, setCloudCodeInfo] =
		useState<ReactNodeWithoutBoolean>(null);

	const updateCloudCodeInfo = useCallback(
		(cloudCode: typeof currentCloudCode) => {
			if (cloudCode === null) {
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
			fetch(`/api/backup/check/${cloudCode}`)
				.then(checkResponse<IBackupCheckSuccessResponse>)
				.then(({ created_at, last_accessed }) => {
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
					if (isObject(error) && 'status' in error) {
						setCloudCodeInfo(
							<span className="text-tiny">
								（
								{error.status === 404
									? '云端未记录此备份码，可能已于他处删除？'
									: '无效的备份码'}
								）
							</span>
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
	}, [currentCloudCode, updateCloudCodeInfo]);

	const handleCloudDeleteButtonPress = useCallback(() => {
		if (!isCloudCodeValid) {
			return;
		}
		setIsCloudDeleteButtonDisabled(true);
		setCloudDeleteButtonLabel(cloudDeleteButtonLabelMap.deleting);
		fetch(`/api/backup/delete/${currentCloudCode}`, { method: 'DELETE' })
			.then(checkResponse)
			.then(() => {
				setCloudDeleteState('success');
				setCloudDeleteButtonLabel(cloudDeleteButtonLabelMap.success);
				globalStore.persistence.cloudCode.set(null);
				trackEvent(
					trackEvent.category.click,
					'Cloud Delete Button',
					currentCloudCode
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
				setTimeout(() => {
					setCloudDeleteState('default');
					setIsCloudDeleteButtonDisabled(false);
					setCloudDeleteButtonLabel(cloudDeleteButtonLabelMap.delete);
				}, 3000);
			});
	}, [currentCloudCode, isCloudCodeValid]);

	const handleCloudDownloadButtonPress = useCallback(() => {
		let code = currentCloudCode;
		code ??= prompt('请输入已有备份码');
		if (!code?.trim()) {
			return;
		}
		setIsCloudDownloadButtonDisabled(true);
		setCloudDownloadButtonLabel(cloudDownloadButtonLabelMap.downloading);
		fetch(`/api/backup/download/${code}?user_id=${userId}`, {
			cache: 'no-cache',
		})
			.then(checkResponse<typeof currentMealData>)
			.then((data) => {
				setCloudDownloadState('success');
				setCloudDownloadButtonLabel(
					cloudDownloadButtonLabelMap.success
				);
				deleteIndexProperty(data.customer_normal);
				deleteIndexProperty(data.customer_rare);
				customerNormalStore.persistence.meals.set(data.customer_normal);
				customerRareStore.persistence.meals.set(data.customer_rare);
				globalStore.persistence.cloudCode.set(code);
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
				updateCloudCodeInfo(currentCloudCode);
				setTimeout(() => {
					setCloudDownloadState('default');
					setIsCloudDownloadButtonDisabled(false);
					setCloudDownloadButtonLabel(
						cloudDownloadButtonLabelMap.download
					);
				}, 3000);
			});
	}, [currentCloudCode, updateCloudCodeInfo, userId]);

	const handleCloudUploadButtonPress = useCallback(() => {
		setIsCloudUploadButtonDisabled(true);
		setCloudUploadButtonLabel(cloudUploadButtonLabelMap.uploading);
		fetch('/api/backup/upload', {
			body: JSON.stringify({
				code: currentCloudCode,
				data: currentMealData,
				user_id: userId,
			} satisfies IBackupUploadBody),
			headers: { 'Content-Type': FILE_TYPE_JSON },
			method: 'POST',
		})
			.then(checkResponse<IBackupUploadSuccessResponse>)
			.then(({ code }) => {
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
				updateCloudCodeInfo(currentCloudCode);
				setTimeout(() => {
					setCloudUploadState('default');
					setIsCloudUploadButtonDisabled(false);
					setCloudUploadButtonLabel(cloudUploadButtonLabelMap.upload);
				}, 3000);
			});
	}, [currentCloudCode, currentMealData, updateCloudCodeInfo, userId]);

	const handleExportButtonPress = useCallback(() => {
		setIsExportButtonDisabled(true);
		setExportButtonLabel(exportButtonLabelMap.downloading);
		setTimeout(() => {
			setIsExportButtonDisabled(false);
			setExportButtonLabel(exportButtonLabelMap.download);
		}, 5000);
		const fileName = `customer_data-${Object.keys(currentMealData.customer_normal).length}_${Object.keys(currentMealData.customer_rare).length}-${Date.now()}`;
		downloadJson(fileName, currentMealDataString);
		trackEvent(trackEvent.category.click, 'Export Button', fileName);
	}, [currentMealData, currentMealDataString]);

	const handleImportData = useCallback(() => {
		toggleSavePopoverOpened();
		if (importData !== null) {
			if ('customer_normal' in importData) {
				deleteIndexProperty(importData.customer_normal);
				deleteIndexProperty(importData.customer_rare);
				customerNormalStore.persistence.meals.set(
					importData.customer_normal
				);
				customerRareStore.persistence.meals.set(
					importData.customer_rare
				);
				trackEvent(
					trackEvent.category.click,
					'Import Button',
					'Customer Data'
				);
			} else {
				deleteIndexProperty(importData);
				customerRareStore.persistence.meals.set(importData);
				trackEvent(
					trackEvent.category.click,
					'Import Button',
					'Customer Rare Data'
				);
			}
		}
	}, [importData]);

	const handleResetData = useCallback(() => {
		toggleResetPopoverOpened();
		customerNormalStore.persistence.meals.set({});
		customerRareStore.persistence.meals.set({});
		trackEvent(trackEvent.category.click, 'Reset Button', 'Customer Data');
	}, []);

	const handleImportButtonPress = useCallback(() => {
		importInputRef.current?.click();
	}, []);

	const handleImportInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const { target } = event;
			parseJsonFromInput(target, (text) => {
				setImportValue(text);
				target.value = '';
			});
		},
		[]
	);

	useEffect(() => {
		const hasValue = Boolean(throttledImportValue);
		try {
			setImportData(null);
			if (!hasValue) {
				setIsSaveButtonError(false);
			}
			setIsSaveButtonLoading(true);
			const json = JSON.parse(throttledImportValue);
			if (Array.isArray(json) || !isObject(json)) {
				throw new TypeError('not an object');
			}
			setImportData(json);
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
	}, [throttledImportValue]);

	useEffect(() => {
		const container = document.querySelector<HTMLDivElement>(
			'#modal-portal-container [data-orientation="vertical"]'
		);
		if (container === null) {
			return;
		}
		container.style.overflowY =
			isSavePopoverOpened || isResetPopoverOpened ? 'hidden' : 'auto';
	}, [isSavePopoverOpened, isResetPopoverOpened]);

	return (
		<>
			<Heading subTitle="备份/还原/重置顾客套餐数据">数据管理</Heading>
			<div className="-mt-2">
				<Tabs
					defaultSelectedKey="reset"
					destroyInactiveTabPanel={false}
					disableAnimation={isReducedMotion}
					variant="underlined"
					onSelectionChange={() => {
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
									placeholder="从本地文件导入或输入顾客套餐数据"
									value={importValue}
									onValueChange={setImportValue}
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
									导入
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
											保存
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
											确认保存
										</Button>
										<Button
											fullWidth
											color="primary"
											size="sm"
											variant="ghost"
											onPress={toggleSavePopoverOpened}
										>
											取消保存
										</Button>
									</PopoverContent>
								</Popover>
							</div>
							<div className="w-full space-y-2 lg:w-1/2">
								<Snippet
									hideSymbol
									fullWidth
									tooltipProps={{
										content: '点击以复制当前的顾客套餐数据',
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
									{currentMealDataString}
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
					{!isOffline && (
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
								isOpen={isResetPopoverOpened}
							>
								<PopoverTrigger>
									<Button
										fullWidth
										color="danger"
										variant="flat"
										onClick={toggleResetPopoverOpened}
										onKeyDown={debounce(
											checkA11yConfirmKey(
												toggleResetPopoverOpened
											)
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
										onPress={handleResetData}
									>
										确认重置
									</Button>
									<Button
										fullWidth
										color="primary"
										size="sm"
										variant="ghost"
										onPress={toggleResetPopoverOpened}
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
									customerRareStore.persistence.recipe.table.dlcs.set(
										[]
									);
									customerRareStore.persistence.recipe.table.sortDescriptor.set(
										{}
									);
									customerRareStore.persistence.beverage.table.dlcs.set(
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
									setTimeout(() => {
										onModalClose?.();
										// Wait for the modal to close (the animate will take 300ms).
										setTimeout(() => {
											if (
												pathname ===
												customerRareTutorialPathname
											) {
												location.reload();
											} else {
												location.href =
													customerRareTutorialPathname;
											}
										}, 300);
									}, 800);
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
		</>
	);
});

export type { IProps as IDataManagerProps };
