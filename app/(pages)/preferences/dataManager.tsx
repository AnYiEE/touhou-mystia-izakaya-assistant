import {type ChangeEvent, memo, useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {debounce, isObjectLike} from 'lodash';

import {useRouter} from 'next/navigation';
import {useProgress} from 'react-transition-progress';
import {usePathname, useThrottle} from '@/hooks';

import {Button, PopoverContent, PopoverTrigger, Snippet, Tab, Tabs, Textarea, cn} from '@nextui-org/react';

import {showProgress} from '@/(pages)/navbar';
import {trackEvent} from '@/components/analytics';
import {
	customerRareTutorialPathname,
	customerRareTutorialResetLabel,
	customerRareTutorialStoreKey,
} from '@/components/customerRareTutorial';
import Heading from '@/components/heading';
import Popover from '@/components/popover';
import Tooltip from '@/components/tooltip';

import {customerNormalStore, customerRareStore, globalStore} from '@/stores';
import {FILE_TYPE_JSON, checkA11yConfirmKey, downloadJson, parseJsonFromInput, toggleBoolean} from '@/utils';

enum DownloadButtonLabel {
	Download = '下载',
	Downloading = '尝试唤起下载器',
	DownloadingTip = '如无响应，请检查浏览器权限、设置和浏览器扩展程序',
}

interface IProps {
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function DataManager({onModalClose}) {
	const pathname = usePathname();
	const router = useRouter();
	const startProgress = useProgress();

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

	const currentMealDataString = useMemo(() => JSON.stringify(currentMealData, null, '\t'), [currentMealData]);

	const [importValue, setImportValue] = useState('');
	const throttledImportValue = useThrottle(importValue);
	const [importData, setImportData] = useState<TMealData | null>(null);
	const importInputRef = useRef<HTMLInputElement | null>(null);

	const [isDownloadButtonDisabled, setIsDownloadButtonDisabled] = useState(false);
	const [downloadButtonLabel, setDownloadButtonLabel] = useState(DownloadButtonLabel.Download);

	const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
	const [isSaveButtonError, setIsSaveButtonError] = useState(false);
	const [isSaveButtonLoading, setIsSaveButtonLoading] = useState(false);
	const [isSavePopoverOpened, toggleSavePopoverOpened] = useReducer(toggleBoolean, false);
	const [isResetPopoverOpened, toggleResetPopoverOpened] = useReducer(toggleBoolean, false);

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const handleDownloadButtonPress = useCallback(() => {
		setIsDownloadButtonDisabled(true);
		setDownloadButtonLabel(DownloadButtonLabel.Downloading);
		setTimeout(() => {
			setIsDownloadButtonDisabled(false);
			setDownloadButtonLabel(DownloadButtonLabel.Download);
		}, 5000);
		downloadJson(
			`customer_data-${Object.keys(currentMealData.customer_normal).length}_${Object.keys(currentMealData.customer_rare).length}-${Date.now()}`,
			currentMealDataString
		);
	}, [currentMealData, currentMealDataString]);

	const handleImportData = useCallback(() => {
		toggleSavePopoverOpened();
		if (importData !== null) {
			if ('customer_normal' in importData) {
				customerNormalStore.persistence.meals.set(importData.customer_normal);
				customerRareStore.persistence.meals.set(importData.customer_rare);
				trackEvent(trackEvent.category.Click, 'Import Button', 'Customer Data');
			} else {
				customerRareStore.persistence.meals.set(importData);
				trackEvent(trackEvent.category.Click, 'Import Button', 'Customer Rare Data');
			}
		}
	}, [importData]);

	const handleResetData = useCallback(() => {
		toggleResetPopoverOpened();
		customerNormalStore.persistence.meals.set({});
		customerRareStore.persistence.meals.set({});
		trackEvent(trackEvent.category.Click, 'Reset Button', 'Customer Data');
	}, []);

	const handleImportButtonPress = useCallback(() => {
		importInputRef.current?.click();
	}, []);

	const handleImportInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const {target} = event;
		parseJsonFromInput(target, (text) => {
			setImportValue(text);
			target.value = '';
		});
	}, []);

	useEffect(() => {
		const hasValue = Boolean(throttledImportValue);
		try {
			setImportData(null);
			if (!hasValue) {
				setIsSaveButtonError(false);
			}
			setIsSaveButtonLoading(true);
			const json = JSON.parse(throttledImportValue) as unknown;
			if (Array.isArray(json) || !isObjectLike(json)) {
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
		if (!container) {
			return;
		}
		if (isSavePopoverOpened || isResetPopoverOpened) {
			container.style.overflowY = 'hidden';
		} else {
			container.style.overflowY = 'auto';
		}
	}, [isSavePopoverOpened, isResetPopoverOpened]);

	return (
		<>
			<Heading subTitle="备份/还原/重置顾客套餐数据">数据管理</Heading>
			<div className="-mt-2">
				<Tabs
					defaultSelectedKey="reset"
					destroyInactiveTabPanel={false}
					variant="underlined"
					onSelectionChange={() => {
						setImportValue('');
					}}
					aria-label="数据管理选项卡"
				>
					<Tab key="backup" title="备份">
						<div className="w-full space-y-2 md:w-1/2">
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
										'bg-default-100/40 backdrop-blur': isHighAppearance,
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
								content={DownloadButtonLabel.DownloadingTip}
								isDisabled={!isDownloadButtonDisabled}
							>
								<Button
									fullWidth
									color={isDownloadButtonDisabled ? 'success' : 'primary'}
									isDisabled={isDownloadButtonDisabled}
									isLoading={isDownloadButtonDisabled}
									variant="flat"
									onPress={handleDownloadButtonPress}
									className={cn({
										'backdrop-blur': isHighAppearance,
									})}
								>
									{downloadButtonLabel}
								</Button>
							</Tooltip>
						</div>
					</Tab>
					<Tab key="restore" title="还原">
						<div className="w-full space-y-2 lg:w-1/2">
							<Textarea
								isClearable
								placeholder="上传或输入顾客套餐数据"
								value={importValue}
								onValueChange={setImportValue}
								classNames={{
									inputWrapper: cn('transition-background data-[hover=true]:bg-default-200', {
										'bg-default-100/40 backdrop-blur data-[hover=true]:bg-default-200/40 group-data-[focus=true]:bg-default-100/70':
											isHighAppearance,
									}),
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
								className={cn({
									'backdrop-blur': isHighAppearance,
								})}
							>
								上传
							</Button>
							<Popover shouldBlockScroll showArrow isOpen={isSavePopoverOpened}>
								<PopoverTrigger>
									<Button
										fullWidth
										color={isSaveButtonError ? 'danger' : 'primary'}
										isDisabled={isSaveButtonDisabled}
										isLoading={isSaveButtonLoading}
										variant="flat"
										onClick={toggleSavePopoverOpened}
										onKeyDown={debounce(checkA11yConfirmKey(toggleSavePopoverOpened))}
										className={cn({
											'backdrop-blur': isHighAppearance,
										})}
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
					</Tab>
					<Tab key="reset" title="重置">
						<div className="w-full space-y-2 md:w-1/2 lg:w-1/3">
							<Popover shouldBlockScroll showArrow isOpen={isResetPopoverOpened}>
								<PopoverTrigger>
									<Button
										fullWidth
										color="danger"
										variant="flat"
										onClick={toggleResetPopoverOpened}
										onKeyDown={debounce(checkA11yConfirmKey(toggleResetPopoverOpened))}
										className={cn({
											'backdrop-blur': isHighAppearance,
										})}
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
									customerRareStore.persistence.customer.filters.set((prev) => {
										Object.keys(prev).forEach((key) => {
											prev[key as keyof typeof prev] = [];
										});
									});
									customerRareStore.persistence.customer.orderLinkedFilter.set(true);
									customerRareStore.persistence.recipe.table.cookers.set([]);
									customerRareStore.persistence.recipe.table.dlcs.set([]);
									customerRareStore.persistence.recipe.table.sortDescriptor.set({});
									customerRareStore.persistence.beverage.table.dlcs.set([]);
									customerRareStore.persistence.beverage.table.sortDescriptor.set({});
									customerRareStore.persistence.ingredient.filters.set((prev) => {
										Object.keys(prev).forEach((key) => {
											prev[key as keyof typeof prev] = [];
										});
									});
									globalStore.persistence.set((prev) => {
										const dirver = prev.dirver.filter(
											(item) => item !== customerRareTutorialStoreKey
										);
										prev.dirver = dirver;
									});
									if (onModalClose === undefined) {
										router.push(customerRareTutorialPathname);
									} else {
										onModalClose();
										// Wait for the modal to close and restore the pathname (the animate will take 300ms).
										setTimeout(() => {
											if (pathname !== customerRareTutorialPathname) {
												location.href = customerRareTutorialPathname;
											}
										}, 500);
									}
									trackEvent(trackEvent.category.Click, 'Reset Button', 'Customer Rare Tutorial');
								}}
								className={cn({
									'backdrop-blur': isHighAppearance,
								})}
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

export type {IProps as IDataManagerProps};
