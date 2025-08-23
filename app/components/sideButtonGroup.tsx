'use client';

import { type PropsWithChildren, memo, useCallback } from 'react';

import { useProgress } from 'react-transition-progress';
import { useVibrate } from '@/hooks';

import { faGear } from '@fortawesome/free-solid-svg-icons';

import { Link, Tooltip, cn } from '@/design/ui/components';

import { showProgress } from '@/(pages)/(layout)/navbar';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function SideButtonGroup({
	children,
	className,
}) {
	const startProgress = useProgress();
	const vibrate = useVibrate();

	const handlePress = useCallback(() => {
		vibrate();
		showProgress(startProgress);
	}, [startProgress, vibrate]);

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
								as={Link}
								// @ts-expect-error Button as Link
								animationUnderline={false}
								color="primary"
								icon={faGear}
								variant="shadow"
								href="/preferences"
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
