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

import { useThrottle } from '@/hooks';
import { useReducedMotion } from '@/design/ui/hooks';

import { Textarea } from '@heroui/input';

import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Snippet,
	Tooltip,
	cn,
} from '@/design/ui/components';

import { getClosestModalScrollContainer } from '@/(pages)/preferences/dataManagerScroll';
import { trackEvent } from '@/components/analytics';

import {
	compatibilityCustomerRareData,
	deleteIndexProperty,
} from '@/actions/backup/compatibility';
import {
	validateCustomerNormalMealsData,
	validateCustomerRareMealsData,
	validateCustomerRarePlansData,
} from '@/lib/account/sync/validation';
import { customerNormalStore, customerRareStore, globalStore } from '@/stores';
import {
	FILE_TYPE_JSON,
	checkA11yConfirmKey,
	downloadJson,
	parseJsonFromInput,
	toggleBoolean,
} from '@/utilities';

const exportButtonLabelMap = {
	download: '导出',
	downloading: '尝试唤起下载器',
	downloadingTip: '如无响应，请检查浏览器权限、设置和浏览器扩展程序',
} as const;

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

type TExportButtonLabel = ExtractCollectionValue<typeof exportButtonLabelMap>;

interface IProps {
	isFullWidth?: boolean | undefined;
}

export default memo<IProps>(function LocalDataManager({ isFullWidth = false }) {
	const isReducedMotion = useReducedMotion();

	const currentNormalMealData = customerNormalStore.persistence.meals.use();
	const currentRareMealData = customerRareStore.persistence.meals.use();
	const currentRarePlanData = customerRareStore.persistence.plans.use();
	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerData = useMemo(
		() => ({
			[CUSTOMER_DATA_KEY_MAP.normalMeals]: currentNormalMealData,
			[CUSTOMER_DATA_KEY_MAP.rareMeals]: currentRareMealData,
			[CUSTOMER_DATA_KEY_MAP.rarePlans]: currentRarePlanData,
		}),
		[currentNormalMealData, currentRareMealData, currentRarePlanData]
	);

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
	const exportTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

	const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
	const [isSaveButtonError, setIsSaveButtonError] = useState(false);
	const [isSaveButtonLoading, setIsSaveButtonLoading] = useState(false);
	const [isSavePopoverOpened, toggleSavePopoverOpened] = useReducer(
		toggleBoolean,
		false
	);
	const localDataManagerRef = useRef<HTMLDivElement | null>(null);

	useEffect(
		() => () => {
			exportTimers.current.forEach(clearTimeout);
		},
		[]
	);

	const handleExportButtonPress = useCallback(() => {
		setIsExportButtonDisabled(true);
		setExportButtonLabel(exportButtonLabelMap.downloading);
		const timerId = setTimeout(() => {
			setIsExportButtonDisabled(false);
			setExportButtonLabel(exportButtonLabelMap.download);
			exportTimers.current = exportTimers.current.filter(
				(id) => id !== timerId
			);
		}, 5000);
		exportTimers.current.push(timerId);
		const fileName = `customer_data-${Object.keys(currentNormalMealData).length}_${Object.keys(currentRareMealData).length}_${currentRarePlanData.items.length}-${Date.now()}`;
		downloadJson(fileName, currentCustomerDataString);
		trackEvent(trackEvent.category.click, 'Export Button', fileName);
	}, [
		currentCustomerDataString,
		currentNormalMealData,
		currentRareMealData,
		currentRarePlanData,
	]);

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
		if (!isSavePopoverOpened) {
			return;
		}

		const container = getClosestModalScrollContainer(
			localDataManagerRef.current
		);

		if (container === null) {
			return;
		}

		const previousOverflowY = container.style.overflowY;
		container.style.overflowY = 'hidden';

		return () => {
			container.style.overflowY = previousOverflowY;
		};
	}, [isSavePopoverOpened]);

	return (
		<div ref={localDataManagerRef} className="w-full space-y-4">
			<div
				className={cn('w-full space-y-2', { 'lg:w-1/2': !isFullWidth })}
			>
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
							color={isSaveButtonError ? 'danger' : 'primary'}
							isDisabled={isSaveButtonDisabled}
							isLoading={isSaveButtonLoading}
							variant="flat"
							onClick={toggleSavePopoverOpened}
							onKeyDown={debounce(
								checkA11yConfirmKey(toggleSavePopoverOpened)
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
			<div
				className={cn('w-full space-y-2', { 'lg:w-1/2': !isFullWidth })}
			>
				<Snippet
					hideSymbol
					fullWidth
					tooltipProps={{
						content: '点击以复制当前的顾客套餐和营业预设数据',
						delay: 0,
						offset: 0,
						showArrow: !isHighAppearance,
					}}
					variant="flat"
					classNames={{
						base: cn({
							'bg-default/40 backdrop-blur': isHighAppearance,
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
					content={exportButtonLabelMap.downloadingTip}
					isDisabled={!isExportButtonDisabled}
				>
					<Button
						fullWidth
						color={isExportButtonDisabled ? 'success' : 'primary'}
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
	);
});
