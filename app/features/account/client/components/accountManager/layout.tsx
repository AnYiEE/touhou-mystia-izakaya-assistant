'use client';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { type PropsWithChildren, memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Card from '@/design/ui/components/card';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

const ACCOUNT_COLLAPSE_MOTION_TRANSITION = {
	duration: 0.18,
	ease: 'easeInOut',
} as const;

const ACCOUNT_AUTH_ENTRY_MOTION_TRANSITION = {
	duration: 0.26,
	ease: 'linear',
} as const;

interface IAccountPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AccountPanel = memo<IAccountPanelProps>(function AccountPanel({
	children,
	className,
}) {
	const { isHighAppearance } = useDesignPreferences();

	return (
		<Card
			as="section"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn('p-4', className, {
					'bg-content1/40 backdrop-blur': isHighAppearance,
				}),
			}}
		>
			{children}
		</Card>
	);
});

interface IAccountPanelTitleProps {
	children: ReactNodeWithoutBoolean;
	className?: string;
	icon: FontAwesomeIconProps['icon'];
	iconClassName?: string;
}

export const AccountPanelTitle = memo<IAccountPanelTitleProps>(
	function AccountPanelTitle({ children, className, icon, iconClassName }) {
		return (
			<div
				className={cn(
					'mb-3 flex items-center gap-2 text-small font-medium text-foreground-700',
					className
				)}
			>
				<FontAwesomeIcon
					icon={icon}
					className={cn('w-4 text-primary-600', iconClassName)}
				/>
				<span>{children}</span>
			</div>
		);
	}
);

interface IAccountCollapseMotionProps extends PropsWithChildren<object> {
	className?: string;
	motionKey: number | string;
}

export const AccountCollapseMotion = memo<IAccountCollapseMotionProps>(
	function AccountCollapseMotion({ children, className, motionKey }) {
		const isReducedMotion = useReducedMotion();
		const shouldRender = children !== null && children !== undefined;

		return (
			<AnimatePresence initial={false}>
				{shouldRender ? (
					isReducedMotion ? (
						<div key={motionKey} className={className}>
							<div className="flow-root">{children}</div>
						</div>
					) : (
						<motion.div
							key={motionKey}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							initial={{ height: 0, opacity: 0 }}
							style={{ overflow: 'hidden' }}
							transition={ACCOUNT_COLLAPSE_MOTION_TRANSITION}
							className={className}
						>
							<div className="flow-root">{children}</div>
						</motion.div>
					)
				) : null}
			</AnimatePresence>
		);
	}
);

interface IAccountAuthEntryMotionProps extends PropsWithChildren<object> {
	motionKey: 'passkey' | 'password';
}

export const AccountAuthEntryMotion = memo<IAccountAuthEntryMotionProps>(
	function AccountAuthEntryMotion({ children, motionKey }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className="flow-root">{children}</div>;
		}

		return (
			<AnimatePresence initial={false}>
				<motion.div
					key={motionKey}
					animate={{ height: 'auto', opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					initial={{ height: 0, opacity: 0 }}
					style={{ overflow: 'hidden' }}
					transition={ACCOUNT_AUTH_ENTRY_MOTION_TRANSITION}
				>
					<div className="flow-root">{children}</div>
				</motion.div>
			</AnimatePresence>
		);
	}
);

interface IAccountAnimatedListProps extends PropsWithChildren<object> {
	className?: string;
}

export const AccountAnimatedList = memo<IAccountAnimatedListProps>(
	function AccountAnimatedList({ children, className }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className={cn('-mt-2', className)}>{children}</div>;
		}

		return (
			<motion.div
				layout
				transition={ACCOUNT_COLLAPSE_MOTION_TRANSITION}
				className={cn('-mt-2', className)}
			>
				<AnimatePresence initial={false}>{children}</AnimatePresence>
			</motion.div>
		);
	}
);

export const AccountAnimatedListItem = memo<PropsWithChildren<object>>(
	function AccountAnimatedListItem({ children }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return (
				<div>
					<div className="flow-root pt-2">{children}</div>
				</div>
			);
		}

		return (
			<motion.div
				layout
				animate={{ height: 'auto', opacity: 1 }}
				exit={{ height: 0, opacity: 0 }}
				initial={{ height: 0, opacity: 0 }}
				style={{ overflow: 'hidden' }}
				transition={ACCOUNT_COLLAPSE_MOTION_TRANSITION}
			>
				<div className="flow-root pt-2">{children}</div>
			</motion.div>
		);
	}
);

interface IAccountInputIconProps extends Pick<FontAwesomeIconProps, 'icon'> {}

export const AccountInputIcon = memo<IAccountInputIconProps>(
	function AccountInputIcon({ icon }) {
		return (
			<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
				<FontAwesomeIcon icon={icon} className="block w-3.5" />
			</span>
		);
	}
);

export function formatSessionTimestamp(timestamp: number) {
	return new Date(timestamp).toLocaleString('zh-CN');
}
