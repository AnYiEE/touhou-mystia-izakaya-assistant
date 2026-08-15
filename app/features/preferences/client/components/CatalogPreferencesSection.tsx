import { memo } from 'react';

import Heading from '@/design/ui/components/heading';

import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';

import HiddenItems from './HiddenItems';
import SwitchItem from './PreferenceSwitchItem';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';
import RecommendationPreferencesSection from './RecommendationPreferencesSection';

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
		specialGuestStore.persistence.guest.orderLinkedFilter.use();
	const isShowTagDescription =
		specialGuestStore.persistence.guest.showTagDescription.use();

	return (
		<>
			<Heading as="h2">顾客页面</Heading>
			<Heading as="h3">酒水、料理和食材</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps('guest-hidden-items')}
					className={getPreferenceTargetClassName(
						'guest-hidden-items',
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
						'special-guest-order-linked-filter'
					)}
					className={getPreferenceTargetClassName(
						'special-guest-order-linked-filter',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isOrderLinkedFilter}
						onValueChange={
							specialGuestStore.persistence.guest
								.orderLinkedFilter.set
						}
						aria-label={`选择点单需求标签的同时${isOrderLinkedFilter ? '不' : ''}筛选表格`}
					>
						选择点单需求的同时筛选表格
					</SwitchItem>
				</div>
				<div
					{...getPreferenceTargetDataProps(
						'special-guest-show-tag-description'
					)}
					className={getPreferenceTargetClassName(
						'special-guest-show-tag-description',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTagDescription}
						onValueChange={
							specialGuestStore.persistence.guest
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
