import { memo } from 'react';

import Heading from '@/design/ui/components/heading';

import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';

import HiddenItems from './HiddenItems';
import SwitchItem from './PreferenceSwitchItem';
import RecommendationPreferencesSection from './RecommendationPreferencesSection';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';

interface IProps {
	highlightedPreferenceKey: null | TPreferenceTargetKey;
	isReducedMotion: boolean;
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function CatalogPreferencesSection({
	highlightedPreferenceKey,
	isReducedMotion,
	onModalClose,
}) {
	const isOrderLinkedFilter =
		customerRareStore.persistence.customer.orderLinkedFilter.use();
	const isShowTagDescription =
		customerRareStore.persistence.customer.showTagDescription.use();

	return (
		<>
			<Heading as="h2">顾客页面</Heading>
			<Heading as="h3">酒水、料理和食材</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps('customer-hidden-items')}
					className={getPreferenceTargetClassName(
						'customer-hidden-items',
						highlightedPreferenceKey
					)}
				>
					<HiddenItems onModalClose={onModalClose} />
				</div>
			</div>
			<RecommendationPreferencesSection
				highlightedPreferenceKey={highlightedPreferenceKey}
				isReducedMotion={isReducedMotion}
			/>
			<Heading as="h3">稀客卡片</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps(
						'customer-order-linked-filter'
					)}
					className={getPreferenceTargetClassName(
						'customer-order-linked-filter',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isOrderLinkedFilter}
						onValueChange={
							customerRareStore.persistence.customer
								.orderLinkedFilter.set
						}
						aria-label={`选择点单需求标签的同时${isOrderLinkedFilter ? '不' : ''}筛选表格`}
					>
						选择点单需求的同时筛选表格
					</SwitchItem>
				</div>
				<div
					{...getPreferenceTargetDataProps(
						'customer-show-tag-description'
					)}
					className={getPreferenceTargetClassName(
						'customer-show-tag-description',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTagDescription}
						onValueChange={
							customerRareStore.persistence.customer
								.showTagDescription.set
						}
						aria-label={`${isShowTagDescription ? '隐藏' : '显示'}料理标签描述`}
					>
						显示料理标签所对应的关键词
					</SwitchItem>
				</div>
			</div>
		</>
	);
});
