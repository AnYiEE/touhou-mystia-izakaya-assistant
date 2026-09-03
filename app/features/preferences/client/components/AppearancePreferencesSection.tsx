import { memo, useCallback } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Heading from '@/design/ui/components/heading';

import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { type TPreferenceTargetKey } from '@/features/preferences/contracts';

import SwitchItem from './PreferenceSwitchItem';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';

const PREFERENCES_APPEARANCE_SWITCH_SETTLE_MS = 800;
const PREFERENCES_MODAL_EXIT_DELAY_MS = 300;

interface IProps {
	highlightedPreferenceKey: null | TPreferenceTargetKey;
	isReducedMotion: boolean;
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function AppearancePreferencesSection({
	highlightedPreferenceKey,
	isReducedMotion,
	onModalClose,
}) {
	const { isHighAppearance } = useDesignPreferences();
	const isShowTachie = globalStore.persistence.tachie.use();

	const handleIsHighAppearanceChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.highAppearance.set(value);
			// Wait for the appearance switch animation to settle before closing.
			setTimeout(
				() => {
					onModalClose?.();
					// Wait for the preferences modal exit animation before reloading.
					setTimeout(
						() => {
							location.reload();
						},
						isReducedMotion ? 0 : PREFERENCES_MODAL_EXIT_DELAY_MS
					);
				},
				isReducedMotion ? 0 : PREFERENCES_APPEARANCE_SWITCH_SETTLE_MS
			);
		},
		[isReducedMotion, onModalClose]
	);

	return (
		<>
			<Heading as="h3">外观</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps(
						'appearance-high-appearance'
					)}
					className={getPreferenceTargetClassName(
						'appearance-high-appearance',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isHighAppearance}
						onValueChange={handleIsHighAppearanceChange}
						aria-label={`${isHighAppearance ? '关闭' : '开启'}平滑滚动和磨砂效果`}
					>
						<span className="flex w-min flex-wrap items-center break-keep md:flex-nowrap">
							<span>平滑滚动和磨砂效果</span>
							<span className="text-tiny text-foreground-500">
								（如因浏览器性能受限而感卡顿可关闭）
								<br />
								（开启或关闭平滑滚动需刷新页面生效）
							</span>
						</span>
					</SwitchItem>
				</div>
				<div
					{...getPreferenceTargetDataProps('appearance-tachie')}
					className={getPreferenceTargetClassName(
						'appearance-tachie',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTachie}
						onValueChange={globalStore.persistence.tachie.set}
						aria-label={`${isShowTachie ? '隐藏' : '显示'}顾客页面立绘`}
					>
						顾客页面右下角的立绘
						<span className="text-tiny text-foreground-500">
							（宽屏可见）
						</span>
					</SwitchItem>
				</div>
			</div>
		</>
	);
});
