'use client';

import { cn } from '@heroui/theme';
import { useCallback } from 'react';

import Link, { type ILinkProps } from '@/design/ui/components/link';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { requestDonationModalOpen } from '@/features/donations/client/requestDonationModalOpen';
import { useVibrate } from '@/features/preferences/client/useVibrate';

interface IProps extends Pick<ILinkProps, 'classNames'> {
	children: ReactNodeWithoutBoolean;
	className?: string;
	eventLabel: string;
}

export default function SupportActionButton({
	children,
	className,
	classNames,
	eventLabel,
}: IProps) {
	const vibrate = useVibrate();

	const handlePress = useCallback(() => {
		vibrate();
		trackEvent(trackEvent.category.click, 'Link', eventLabel);
		void requestDonationModalOpen('manual');
	}, [eventLabel, vibrate]);

	return (
		<Link
			showAnchorIcon
			href="#"
			aria-haspopup="dialog"
			role="button"
			onPress={handlePress}
			onClick={(event) => {
				event.preventDefault();
			}}
			className={cn('rounded-small indent-0', className)}
			{...(classNames === undefined ? {} : { classNames })}
		>
			{children}
		</Link>
	);
}
