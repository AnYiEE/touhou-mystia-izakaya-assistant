'use client';

import {
	type ChangeEvent,
	type KeyboardEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react';
import {useRouter} from 'next/navigation';
import {useProgress} from 'react-transition-progress';
import {debounce, isObjectLike} from 'lodash';

import {useThrottle} from '@/hooks';

import {Button, Popover, PopoverContent, PopoverTrigger, Snippet, Tab, Tabs, Textarea} from '@nextui-org/react';

import {showProgress} from '@/(pages)/navbar';
import {TrackCategory, trackEvent} from '@/components/analytics';
import {
	customerRareTutorialPathname,
	customerRareTutorialResetLabel,
	customerRareTutorialStoreKey,
} from '@/components/customerRareTutorial';
import H1 from '@/components/h1';

import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, toggleBoolean} from '@/utils';

const JSON_TYPE = 'application/json';

enum DownloadButtonLabel {
	Download = '下載',
	Downloading = '已尝试唤起下载',
}

function download(fileName: string, jsonString: string) {
	const blob = new Blob([jsonString], {
		type: JSON_TYPE,
	});
	const url = URL.createObjectURL(blob);

	const element = document.createElement('a');
	element.classList.add('hidden');
	element.download = `${fileName}.json`;
	element.href = url;
	document.body.append(element);
	element.click();

	element.remove();
	URL.revokeObjectURL(url);
}

interface IProps {
	onModalClose: (() => void) | undefined;
}

export default memo<Partial<IProps>>(function DataManager({onModalClose}) {
	const router = useRouter();
	const startProgress = useProgress();

	const [importValue, setImportValue] = useState('');
	const throttledImportValue = useThrottle(importValue);
	const [importData, setImportData] = useState<object | null>(null);
	const importInputRef = useRef<HTMLInputElement | null>(null);

	const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
	const [isSaveButtonError, setIsSaveButtonError] = useState(false);
	const [isSaveButtonLoading, setIsSaveButtonLoading] = useState(false);
	const [isSavePopoverOpened, toggleSavePopoverOpened] = useReducer(toggleBoolean, false);
	const [isResetPopoverOpened, toggleResetPopoverOpened] = useReducer(toggleBoolean, false);

	const currentMealData = customerStore.persistence.meals.use();
	const currentMealDataString = useMemo(() => JSON.stringify(currentMealData, null, '\t'), [currentMealData]);

	const [downloadButtonLabel, setDownloadButtonLabel] = useState(DownloadButtonLabel.Download);
	const downloadButtonLabelTimer = useRef<NodeJS.Timeout>();

	const hideDownloadingLabel = useCallback(() => {
		setDownloadButtonLabel(DownloadButtonLabel.Download);
		clearTimeout(downloadButtonLabelTimer.current);
	}, []);

	const showDownloadingLabel = useCallback(() => {
		setDownloadButtonLabel(DownloadButtonLabel.Downloading);
		clearTimeout(downloadButtonLabelTimer.current);
		downloadButtonLabelTimer.current = setTimeout(() => {
			hideDownloadingLabel();
		}, 3000);
	}, [hideDownloadingLabel]);

	const handleDownloadButtonPress = useCallback(() => {
		showDownloadingLabel();
		download(`customer_rare_data-${Object.keys(currentMealData).length}-${Date.now()}`, currentMealDataString);
	}, [currentMealData, currentMealDataString, showDownloadingLabel]);

	const handleImportData = useCallback(() => {
		toggleSavePopoverOpened();
		if (importData) {
			customerStore.persistence.meals.set(importData);
		}
		trackEvent(TrackCategory.Click, 'Import Button', 'Customer Rare Data');
	}, [importData]);

	const handleResetData = useCallback(() => {
		toggleResetPopoverOpened();
		customerStore.persistence.meals.set({});
		trackEvent(TrackCategory.Click, 'Reset Button', 'Customer Rare Data');
	}, []);

	const handleImportButtonPress = useCallback(() => {
		importInputRef.current?.click();
	}, []);

	const handleImportInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const {target} = event;
		if (!target.files) {
			return;
		}
		const {
			files: [file],
		} = target;
		if (!file) {
			return;
		}
		const blob = new Blob([file], {
			type: JSON_TYPE,
		});
		void blob.text().then((text) => {
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

	return (
		<>
			<H1 subTitle="备份/还原/重置稀客套餐数据">数据管理</H1>
			<div className="-mt-2 flex flex-col">
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
						<div className="flex w-full flex-col gap-2 md:w-1/2">
							<Snippet
								hideSymbol
								tooltipProps={{
									content: '点击复制当前的稀客套餐数据',
									delay: 0,
									offset: -5,
									showArrow: true,
								}}
								variant="flat"
								classNames={{
									base: 'min-w-min',
									pre: 'max-h-[13.25rem] basis-full overflow-auto whitespace-pre-wrap',
								}}
							>
								{currentMealDataString}
							</Snippet>
							<Button fullWidth color="primary" variant="flat" onPress={handleDownloadButtonPress}>
								{downloadButtonLabel}
							</Button>
						</div>
					</Tab>
					<Tab key="restore" title="还原">
						<div className="flex w-full flex-col gap-2 lg:w-1/2">
							<Textarea
								placeholder="输入稀客套餐数据"
								value={importValue}
								onValueChange={setImportValue}
							/>
							<input
								accept={JSON_TYPE}
								type="file"
								onChange={handleImportInputChange}
								className="hidden"
								ref={importInputRef}
							/>
							<Button fullWidth color="primary" variant="flat" onPress={handleImportButtonPress}>
								上传
							</Button>
							<Popover showArrow isOpen={isSavePopoverOpened}>
								<PopoverTrigger>
									<Button
										fullWidth
										color={isSaveButtonError ? 'danger' : 'primary'}
										isDisabled={isSaveButtonDisabled}
										isLoading={isSaveButtonLoading}
										variant="flat"
										onClick={toggleSavePopoverOpened}
										onKeyDown={debounce((event: KeyboardEvent<HTMLButtonElement>) => {
											if (checkA11yConfirmKey(event)) {
												toggleSavePopoverOpened();
											}
										})}
									>
										保存
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Button
										color="primary"
										variant="ghost"
										onClick={handleImportData}
										onKeyDown={debounce((event: KeyboardEvent<HTMLButtonElement>) => {
											if (event.key === 'Escape') {
												toggleSavePopoverOpened();
											}
											if (checkA11yConfirmKey(event)) {
												handleImportData();
											}
										})}
									>
										确认保存
									</Button>
								</PopoverContent>
							</Popover>
						</div>
					</Tab>
					<Tab key="reset" title="重置">
						<div className="flex w-full flex-col gap-2 md:w-1/2 lg:w-1/3">
							<Popover showArrow isOpen={isResetPopoverOpened}>
								<PopoverTrigger>
									<Button
										color="danger"
										variant="flat"
										onClick={toggleResetPopoverOpened}
										onKeyDown={debounce((event: KeyboardEvent<HTMLButtonElement>) => {
											if (checkA11yConfirmKey(event)) {
												toggleResetPopoverOpened();
											}
										})}
									>
										重置已保存的稀客套餐数据
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Button
										color="danger"
										variant="ghost"
										onClick={handleResetData}
										onKeyDown={debounce((event: KeyboardEvent<HTMLButtonElement>) => {
											if (event.key === 'Escape') {
												toggleResetPopoverOpened();
											}
											if (checkA11yConfirmKey(event)) {
												handleResetData();
											}
										})}
									>
										确认重置
									</Button>
								</PopoverContent>
							</Popover>
							<Button
								color="primary"
								variant="flat"
								onPress={() => {
									showProgress(startProgress);
									customerStore.persistence.customer.filters.set((prev) => {
										Object.keys(prev).forEach((key) => {
											prev[key as keyof typeof prev] = [];
										});
									});
									customerStore.shared.customer.data.set(null);
									customerStore.shared.tab.set('customer');
									customerStore.shared.customer.filterVisibility.set(true);
									customerStore.shared.ingredient.filterVisibility.set(false);
									globalStore.persistence.set((prev) => {
										const dirver = prev.dirver.filter(
											(item) => item !== customerRareTutorialStoreKey
										);
										prev.dirver = dirver;
									});
									if (onModalClose) {
										onModalClose();
									} else {
										router.push(customerRareTutorialPathname);
									}
									trackEvent(TrackCategory.Click, 'Reset Button', 'Customer Rare Tutorial');
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
