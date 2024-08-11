'use client';

import {memo, useCallback} from 'react';

import {Select, SelectItem, type Selection, Switch} from '@nextui-org/react';

import DataManager from './dataManager';
import SwitchItem from './switchItem';
import H1 from '@/components/h1';
import H2 from '@/components/h2';
import H3 from '@/components/h3';

import {useCustomerRareStore, useGlobalStore} from '@/stores';

interface IProps {
	onModalClose?: () => void;
}

export default memo<IProps>(function Content({onModalClose}) {
	const customerStore = useCustomerRareStore();
	const globalStore = useGlobalStore();

	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const popularTags = globalStore.popularTags.get();
	const isNegativePopularTag = globalStore.persistence.popular.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

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
			<H1 isFirst subTitle="以下的所有更改都会即时生效">
				设置
			</H1>
			<H2 className="mt-0">全局设置</H2>
			<SwitchItem
				isSelected={isShowTagsTooltip}
				onValueChange={globalStore.persistence.customerCardTagsTooltip.set}
				aria-label={`${isShowTagsTooltip ? '隐藏' : '显示'}标签浮动提示`}
			>
				顾客卡片中标签的浮动提示
			</SwitchItem>
			<H3>流行标签</H3>
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
			<SwitchItem
				isSelected={isShowTagDescription}
				onValueChange={customerStore.persistence.customer.showTagDescription.set}
				aria-label={`${isShowTagDescription ? '隐藏' : '显示'}料理标签描述`}
			>
				稀客卡片中料理标签的描述
			</SwitchItem>
			<DataManager onModalClose={onModalClose} />
		</div>
	);
});
