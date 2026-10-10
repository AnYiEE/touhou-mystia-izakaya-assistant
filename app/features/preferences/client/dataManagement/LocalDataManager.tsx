import { Textarea } from '@heroui/input';
import { cn } from '@heroui/theme';
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

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Snippet from '@/design/ui/components/snippet';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import {
	type TPreferencesMessageKey,
	preferencesMessages,
} from '@/features/preferences/client/messages';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';

import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';

import { useI18n } from '@/shared/i18n/useI18n';
import { useThrottle } from '@/shared/react/useThrottle';

import { getClosestModalScrollContainer } from './dataManagerScroll';
import {
	GUEST_DATA_KEY_MAP,
	type IGuestDataImport,
	parseGuestDataImport,
} from './parseGuestDataImport';
import { downloadJson, parseJsonFromInput } from './processJsonFile';

const EXPORT_BUTTON_LABEL_KEYS = {
	download: 'preferences.local.export',
	downloading: 'preferences.local.exporting',
	downloadingTip: 'preferences.local.exportTip',
} as const satisfies Record<string, TPreferencesMessageKey>;

interface IProps {
	isFullWidth?: boolean | undefined;
}

export default memo<IProps>(function LocalDataManager({ isFullWidth = false }) {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const { t } = useI18n(preferencesMessages);

	const currentNormalMealData = normalGuestStore.persistence.meals.use();
	const currentRareMealData = specialGuestStore.persistence.meals.use();
	const currentRarePlanData = specialGuestPlansStore.persistence.plans.use();

	const importTextareaClassNames = useMemo(
		() => ({
			inputWrapper: cn(
				'bg-default/40 transition-background data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default motion-reduce:transition-none',
				{
					'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70':
						isHighAppearance,
				}
			),
		}),
		[isHighAppearance]
	);
	const exportSnippetTooltipProps = useMemo(
		() => ({
			content: t('preferences.local.copyTip'),
			delay: 0,
			offset: 0,
			showArrow: !isHighAppearance,
		}),
		[isHighAppearance, t]
	);
	const exportSnippetClassNames = useMemo(
		() => ({
			base: cn({ 'bg-default/40 backdrop-blur': isHighAppearance }),
			pre: 'max-h-[13.25rem] w-full overflow-auto whitespace-pre-wrap',
		}),
		[isHighAppearance]
	);

	const currentGuestData = useMemo(
		() => ({
			[GUEST_DATA_KEY_MAP.normalMeals]: currentNormalMealData,
			[GUEST_DATA_KEY_MAP.rareMeals]: currentRareMealData,
			[GUEST_DATA_KEY_MAP.rarePlans]: currentRarePlanData,
		}),
		[currentNormalMealData, currentRareMealData, currentRarePlanData]
	);

	const currentGuestDataString = useMemo(
		() => JSON.stringify(currentGuestData, null, '\t'),
		[currentGuestData]
	);

	const [importValue, setImportValue] = useState('');
	const importValueRef = useRef(importValue);
	importValueRef.current = importValue;
	const throttledImportValue = useThrottle(importValue);
	const [importData, setImportData] = useState<IGuestDataImport | null>(null);
	const [importReadError, setImportReadError] = useState(false);
	const importReadRequestIdRef = useRef(0);
	const importInputRef = useRef<HTMLInputElement | null>(null);

	const [isExportButtonDisabled, setIsExportButtonDisabled] = useState(false);
	const [exportButtonLabelKey, setExportButtonLabelKey] =
		useState<TPreferencesMessageKey>(EXPORT_BUTTON_LABEL_KEYS.download);
	const exportTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

	const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
	const [isSaveButtonError, setIsSaveButtonError] = useState(false);
	const [isSaveButtonLoading, setIsSaveButtonLoading] = useState(false);
	const [isSavePopoverOpened, toggleSavePopoverOpened] = useReducer(
		(value: boolean) => !value,
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
		setExportButtonLabelKey(EXPORT_BUTTON_LABEL_KEYS.downloading);
		const timerId = setTimeout(() => {
			setIsExportButtonDisabled(false);
			setExportButtonLabelKey(EXPORT_BUTTON_LABEL_KEYS.download);
			exportTimers.current = exportTimers.current.filter(
				(id) => id !== timerId
			);
		}, 5000);
		exportTimers.current.push(timerId);
		const fileName = `customer_data-${Object.keys(currentNormalMealData).length}_${Object.keys(currentRareMealData).length}_${currentRarePlanData.items.length}-${Date.now()}`;
		downloadJson(fileName, currentGuestDataString);
		trackEvent(trackEvent.category.click, 'Export Button', fileName);
	}, [
		currentGuestDataString,
		currentNormalMealData,
		currentRareMealData,
		currentRarePlanData,
	]);

	const handleImportData = useCallback(() => {
		toggleSavePopoverOpened();
		if (importData !== null) {
			const { data, eventName } = importData;
			if (data.customer_normal_meals !== undefined) {
				normalGuestStore.persistence.meals.set(
					data.customer_normal_meals
				);
			}
			if (data.customer_rare_meals !== undefined) {
				specialGuestStore.persistence.meals.set(
					data.customer_rare_meals
				);
			}
			if (data.customer_rare_plans !== undefined) {
				specialGuestPlansStore.persistence.plans.set(
					data.customer_rare_plans
				);
			}
			trackEvent(trackEvent.category.click, 'Import Button', eventName);
		}
	}, [importData]);

	const handleImportButtonPress = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Import Button',
			'Select Guest Data File'
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
			setImportData(parseGuestDataImport(json));

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
					placeholder={t('preferences.local.importPlaceholder')}
					value={importValue}
					onValueChange={handleImportValueChange}
					classNames={importTextareaClassNames}
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
					{t('preferences.local.selectFile')}
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
						>
							{t('preferences.local.apply')}
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
							{t('preferences.local.confirmApply')}
						</Button>
						<Button
							fullWidth
							color="primary"
							size="sm"
							variant="ghost"
							onPress={toggleSavePopoverOpened}
						>
							{t('preferences.local.cancel')}
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
					tooltipProps={exportSnippetTooltipProps}
					variant="flat"
					classNames={exportSnippetClassNames}
				>
					{currentGuestDataString}
				</Snippet>
				<Tooltip
					isOpen
					showArrow
					color="success"
					content={t(EXPORT_BUTTON_LABEL_KEYS.downloadingTip)}
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
						{t(exportButtonLabelKey)}
					</Button>
				</Tooltip>
			</div>
		</div>
	);
});
