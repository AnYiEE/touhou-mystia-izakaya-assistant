'use client';

import { faGear } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useCallback } from 'react';

import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Tooltip from '@/design/ui/components/tooltip';

import { openPreferencesModal } from '@/features/preferences/client/overlayCommands';
import { useVibrate } from '@/features/preferences/client/useVibrate';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function SideButtonGroup({
	children,
	className,
}) {
	const vibrate = useVibrate();

	const handleClick = useCallback(() => {
		vibrate();
		openPreferencesModal({ openSource: 'sideButton' });
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
								onClick={handleClick}
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
