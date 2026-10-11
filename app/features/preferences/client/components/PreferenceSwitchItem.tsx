import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useMemo } from 'react';

import Switch, { type ISwitchProps } from '@/design/ui/components/switch';
import Tooltip from '@/design/ui/components/tooltip';

import { preferencesMessages } from '@/features/preferences/client/messages';

import { isChineseLocale } from '@/shared/i18n/locale';
import { useI18n } from '@/shared/i18n/useI18n';

interface IProps extends Pick<
	ISwitchProps,
	'color' | 'className' | 'isDisabled' | 'title'
> {
	'aria-label': NonNullable<ISwitchProps['aria-label']>;
	isSelected: NonNullable<ISwitchProps['isSelected']>;
	onValueChange: NonNullable<ISwitchProps['onValueChange']>;
}

export default memo<PropsWithChildren<IProps>>(function SwitchItem({
	children,
	className,
	isDisabled,
	isSelected,
	onValueChange,
	title,
	...props
}) {
	const { locale, t } = useI18n(preferencesMessages);

	const isCompactSwitchTrack = isChineseLocale(locale);
	const isShortStateLabel = locale === 'en';

	const classNames = useMemo(
		() => ({
			base: cn(isDisabled && 'pointer-events-auto cursor-not-allowed'),
			endContent: isCompactSwitchTrack
				? 'leading-none'
				: 'leading-none group-data-[selected=true]:opacity-0',
			hiddenInput: cn(isDisabled && 'pointer-events-none'),
			startContent: isCompactSwitchTrack
				? 'leading-none'
				: 'leading-none opacity-0 group-data-[selected=true]:opacity-100',
			thumb: isCompactSwitchTrack
				? undefined
				: isShortStateLabel
					? 'group-data-[selected=true]:ms-6'
					: 'group-data-[selected=true]:ms-8',
			wrapper: isCompactSwitchTrack
				? undefined
				: isShortStateLabel
					? 'w-12'
					: 'w-14',
		}),
		[isCompactSwitchTrack, isDisabled, isShortStateLabel]
	);

	return (
		<div className={cn('flex items-center gap-2', className)}>
			{children !== undefined && (
				<span className="font-medium">{children}</span>
			)}
			<Tooltip
				content={title}
				isDisabled={title === undefined}
				offset={1}
				size="sm"
			>
				<Switch
					endContent={<span>{t('preferences.switch.off')}</span>}
					startContent={<span>{t('preferences.switch.on')}</span>}
					isDisabled={Boolean(isDisabled)}
					isSelected={isSelected}
					size="sm"
					onValueChange={onValueChange}
					classNames={classNames}
					{...props}
				/>
			</Tooltip>
		</div>
	);
});
