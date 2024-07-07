'use client';

import {memo, useEffect, useMemo, useReducer, useState} from 'react';

import {useThrottle} from '@/hooks';

import {Button, Popover, PopoverContent, PopoverTrigger, Snippet, Tab, Tabs, Textarea} from '@nextui-org/react';

import H1 from './h1';

import {useCustomerRareStore} from '@/stores';

export default memo(function DataManager() {
	const [value, setValue] = useState('');
	const throttledValue = useThrottle(value);

	const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
	const [isSavePopoverOpened, setIsSavePopoverOpened] = useReducer((current) => !current, false);
	const [isResetPopoverOpened, setIsResetPopoverOpened] = useReducer((current) => !current, false);

	const store = useCustomerRareStore();

	const mealData = store.persistence.meals.use();
	const jsonString = useMemo(() => JSON.stringify(mealData, null, '\t'), [mealData]);

	useEffect(() => {
		try {
			const json = JSON.parse(throttledValue) as unknown;
			if (Array.isArray(json) || typeof json !== 'object') {
				throw new TypeError('not an object');
			}
			setIsSaveButtonDisabled(false);
		} catch {
			setIsSaveButtonDisabled(true);
		}
	}, [throttledValue]);

	return (
		<>
			<H1>数据管理</H1>
			<div className="flex flex-col">
				<span className="-mt-4 mb-2 text-foreground-500">备份/还原/重置稀客套餐数据</span>
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
										onClick={setIsSavePopoverOpened}
									>
										保存
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Button
										color="primary"
										variant="ghost"
										onPress={() => {
											setIsSavePopoverOpened();
											// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
											store.persistence.meals.set(JSON.parse(throttledValue));
										}}
									>
										确认保存
									</Button>
								</PopoverContent>
							</Popover>
						</div>
					</Tab>
					<Tab key="reset" title="重置">
						<Popover showArrow isOpen={isResetPopoverOpened}>
							<PopoverTrigger>
								<Button color="danger" variant="flat" onClick={setIsResetPopoverOpened}>
									重置现有稀客套餐数据（数据出错时可使用）
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Button
									color="danger"
									variant="ghost"
									onPress={() => {
										setIsResetPopoverOpened();
										store.persistence.meals.set({});
									}}
								>
									确认重置
								</Button>
							</PopoverContent>
						</Popover>
					</Tab>
				</Tabs>
			</div>
		</>
	);
});
