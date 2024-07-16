'use client';

import {type KeyboardEvent, memo, useCallback, useEffect, useMemo, useReducer, useState} from 'react';
import {debounce, isObject} from 'lodash';

import {useRouter} from 'next/navigation';

import {useThrottle} from '@/hooks';

import {Button, Popover, PopoverContent, PopoverTrigger, Snippet, Tab, Tabs, Textarea} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import {
	customerRareTutorialPathname,
	customerRareTutorialResetLabel,
	customerRareTutorialStoreKey,
} from '@/components/customerRareTutorial';

import H1 from './h1';

import {useCustomerRareStore, useGlobalStore} from '@/stores';
import {checkA11yConfirmKey} from '@/utils';

export default memo(function DataManager() {
	const [value, setValue] = useState('');
	const throttledValue = useThrottle(value);

	const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
	const [isSavePopoverOpened, toggleSavePopoverOpened] = useReducer((current) => !current, false);
	const [isResetPopoverOpened, toggleResetPopoverOpened] = useReducer((current) => !current, false);

	const customerStore = useCustomerRareStore();
	const globalStore = useGlobalStore();
	const router = useRouter();

	const mealData = customerStore.persistence.meals.use();
	const jsonString = useMemo(() => JSON.stringify(mealData, null, '\t'), [mealData]);

	useEffect(() => {
		try {
			const json = JSON.parse(throttledValue) as unknown;
			if (Array.isArray(json) || !isObject(json)) {
				throw new TypeError('not an object');
			}
			setIsSaveButtonDisabled(false);
		} catch {
			setIsSaveButtonDisabled(true);
		}
	}, [throttledValue]);

	const handleImportData = useCallback(() => {
		toggleSavePopoverOpened();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		customerStore.persistence.meals.set(JSON.parse(throttledValue));
		trackEvent(TrackCategory.Click, 'Import Button', 'Customer Rare Data');
	}, [customerStore.persistence.meals, throttledValue]);

	const handleResetData = useCallback(() => {
		toggleResetPopoverOpened();
		customerStore.persistence.meals.set({});
		trackEvent(TrackCategory.Click, 'Reset Button', 'Customer Rare Data');
	}, [customerStore.persistence.meals]);

	return (
		<>
			<H1 subTitle="备份/还原/重置稀客套餐数据">数据管理</H1>
			<div className="-mt-2 flex flex-col">
				<Tabs
					defaultSelectedKey="reset"
					destroyInactiveTabPanel={false}
					variant="underlined"
					onSelectionChange={() => {
						setValue('');
					}}
					aria-label="数据管理选项卡"
				>
					<Tab key="backup" title="备份">
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
								pre: 'max-h-[13.25rem] overflow-auto whitespace-pre-wrap',
							}}
						>
							{jsonString}
						</Snippet>
					</Tab>
					<Tab key="restore" title="还原">
						<div className="flex w-full flex-col gap-2 lg:w-1/2">
							<Textarea placeholder="输入稀客套餐数据" value={value} onValueChange={setValue} />
							<Popover showArrow isOpen={isSavePopoverOpened}>
								<PopoverTrigger>
									<Button
										fullWidth
										color="primary"
										isDisabled={isSaveButtonDisabled}
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
										重置现有稀客套餐数据（数据出错时可使用）
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
									customerStore.shared.customer.data.set(null);
									customerStore.shared.tab.set('customer');
									globalStore.persistence.set((prev) => {
										const dirver = prev.dirver.filter(
											(item) => item !== customerRareTutorialStoreKey
										);
										prev.dirver = dirver;
									});
									router.push(customerRareTutorialPathname);
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
