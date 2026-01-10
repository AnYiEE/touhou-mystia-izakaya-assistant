'use client';

import { type PropsWithChildren, memo, useCallback } from 'react';

import { useVibrate } from '@/hooks';

import { faGear } from '@fortawesome/free-solid-svg-icons';

import { Tooltip, cn } from '@/design/ui/components';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

import { globalStore as store } from '@/stores';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function SideButtonGroup({
	children,
	className,
}) {
	const vibrate = useVibrate();

	const handlePress = useCallback(() => {
		vibrate();
		store.setPreferencesModalIsOpen(true);
	}, [vibrate]);

	const preferencesLabel = '设置';

	return (
		<div className="absolute">
			<div
				className={cn(
					'fixed bottom-6 right-6 z-20 h-min w-min',
					className
				)}
			>
				<div className="space-y-3">
					{children}
					<Tooltip
						showArrow
						content={preferencesLabel}
						placement="left"
					>
						<span className="flex md:hidden">
							<FontAwesomeIconButton
								color="primary"
								icon={faGear}
								variant="shadow"
								onPress={handlePress}
								aria-label={preferencesLabel}
								className="bg-primary-600"
							/>
						</span>
					</Tooltip>
				</div>
			</div>
		</div>
	);
});
