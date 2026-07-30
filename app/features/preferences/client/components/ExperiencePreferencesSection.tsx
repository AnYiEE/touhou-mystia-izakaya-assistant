import { memo } from 'react';

import Heading from '@/design/ui/components/heading';

import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import SwitchItem from './PreferenceSwitchItem';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';

interface IProps {
	highlightedPreferenceKey: null | TPreferenceTargetKey;
}

export default memo<IProps>(function ExperiencePreferencesSection({
	highlightedPreferenceKey,
}) {
	const isShowTagsTooltip =
		globalStore.persistence.customerCardTagsTooltip.use();
	const isVibrateEnabled = globalStore.persistence.vibrate.use();

	return (
		<>
			<Heading as="h3">体验</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps('experience-vibrate')}
					className={getPreferenceTargetClassName(
						'experience-vibrate',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isVibrateEnabled}
						onValueChange={globalStore.persistence.vibrate.set}
						aria-label={`${isVibrateEnabled ? '关闭' : '开启'}操作震动反馈`}
					>
						部分操作的震动反馈
						<span className="text-tiny text-foreground-500">
							（需设备和浏览器支持）
						</span>
					</SwitchItem>
				</div>
				<div
					{...getPreferenceTargetDataProps('experience-tags-tooltip')}
					className={getPreferenceTargetClassName(
						'experience-tags-tooltip',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTagsTooltip}
						onValueChange={
							globalStore.persistence.customerCardTagsTooltip.set
						}
						aria-label={`${isShowTagsTooltip ? '隐藏' : '显示'}标签浮动提示`}
					>
						顾客卡片中标签的浮动提示
						<span className="text-tiny text-foreground-500">
							（鼠标悬停可见）
						</span>
					</SwitchItem>
				</div>
			</div>
		</>
	);
});
