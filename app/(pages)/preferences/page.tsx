'use client';

import {memo, useCallback} from 'react';

import {Select, SelectItem, type Selection, Switch} from '@nextui-org/react';

import DataManager from './dataManager';
import H1 from '@/components/h1';
import H2 from '@/components/h2';

import {useCustomerRareStore, useGlobalStore} from '@/stores';

export default memo(function Preferences() {
	const customerStore = useCustomerRareStore();
	const globalStore = useGlobalStore();

	const popularTags = globalStore.popularTags.get();
	const isNegativePopularTag = globalStore.persistence.popular.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const onIsNegativePopularTagChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.popular.isNegative.set(value);
			customerStore.shared.recipe.page.set(1);
		},
		[customerStore.shared.recipe.page, globalStore.persistence.popular.isNegative]
	);

	const onSelectedPopularTagChange = useCallback(
		(value: Selection) => {
			globalStore.selectedPopularTag.set(value);
			customerStore.shared.recipe.page.set(1);
		},
		[customerStore.shared.recipe.page, globalStore.selectedPopularTag]
	);

	return (
		<div className="leading-6">
			<H1 isFirst subTitle="以下的更改会即时生效">
				设置
			</H1>
			<H2 className="mt-0">流行标签</H2>
			<div className="space-y-2">
				<div className="flex items-center">
					<span className="font-medium">类别：</span>
					流行喜爱
					<Switch
						isSelected={isNegativePopularTag}
						size="sm"
						onValueChange={onIsNegativePopularTagChange}
						aria-label={`设置为流行${isNegativePopularTag ? '喜爱' : '厌恶'}`}
						className="ml-2"
						classNames={{
							wrapper: 'bg-primary',
						}}
					/>
					流行厌恶
				</div>
				<div className="flex items-center">
					<span className="font-medium">标签：</span>
					<Select
						items={popularTags}
						defaultSelectedKeys={selectedPopularTag}
						selectedKeys={selectedPopularTag}
						size="sm"
						variant="flat"
						onSelectionChange={onSelectedPopularTagChange}
						aria-label="选择游戏中现时流行的标签"
						title="选择游戏中现时流行的标签"
						className="w-28"
					>
						{({value}) => <SelectItem key={value}>{value}</SelectItem>}
					</Select>
				</div>
			</div>
			<H2>稀客页面</H2>
			<div className="flex items-center">
				<span className="font-medium">显示料理标签描述</span>
				<Switch
					endContent={<span>关</span>}
					startContent={<span>开</span>}
					isSelected={isShowTagDescription}
					size="sm"
					onValueChange={customerStore.persistence.customer.showTagDescription.set}
					aria-label={`${isShowTagDescription ? '隐藏' : '显示'}料理标签描述`}
					className="ml-2"
					classNames={{
						endContent: 'leading-none',
						startContent: 'leading-none',
						wrapper: 'bg-default-300 dark:bg-default-200',
					}}
				/>
			</div>
			<DataManager />
		</div>
	);
});
