'use client';

import { cn } from '@heroui/theme';
import { type ReactNode, memo, useLayoutEffect, useRef } from 'react';

import {
	type TLoginGateDisplayMode,
	useLoginGate,
} from '@/features/loginGate/client/LoginGateContext';
import { loginGateMessages } from '@/features/loginGate/client/messages';
import { type TLoginGateCountKind } from '@/features/loginGate/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

const MAX_HEIGHT_CLASS_NAMES = {
	lg: 'max-h-64',
	md: 'max-h-40',
	sm: 'max-h-24',
} as const;

export type TLoginGateVeilHeight = keyof typeof MAX_HEIGHT_CLASS_NAMES;

export interface ILoginGateVeilProps {
	children: ReactNode;
	/** Outer box, e.g. `col-span-full` inside a grid host. */
	className?: string | undefined;
	/** Layout of the veiled items; usually the host list's own spacing. */
	contentClassName?: string | undefined;
	count: number;
	countKind: TLoginGateCountKind;
	displayMode: Exclude<TLoginGateDisplayMode, 'full'>;
	maxHeight?: TLoginGateVeilHeight | undefined;
	/** Replaces the count tag, e.g. a prompt card for a single-group host. */
	overlay?: ReactNode;
}

/**
 * A paper screen over the real remainder of a repeated group: the rows keep
 * their shape and colour but cannot be read, focused, or reached by assistive
 * technology. Only the count (or `overlay`) is exposed.
 */
export default memo<ILoginGateVeilProps>(function LoginGateVeil({
	children,
	className,
	contentClassName,
	count,
	countKind,
	displayMode,
	maxHeight = 'md',
	overlay,
}) {
	const { t } = useI18n(loginGateMessages);
	const { primaryActionRef } = useLoginGate();

	const contentRef = useRef<HTMLDivElement>(null);

	const isRevealing = displayMode === 'revealing';

	// Never leave focus inside the inert subtree.
	useLayoutEffect(() => {
		const content = contentRef.current;
		if (isRevealing || !content?.contains(document.activeElement)) {
			return;
		}
		const primaryAction = primaryActionRef.current;
		if (primaryAction === null) {
			(document.activeElement as HTMLElement | null)?.blur();
		} else {
			primaryAction.focus();
		}
	}, [isRevealing, primaryActionRef]);

	return (
		<div
			data-login-gate-veil={displayMode}
			className={cn('relative grid', className)}
		>
			<div
				ref={contentRef}
				aria-hidden={isRevealing ? undefined : true}
				inert={!isRevealing}
				className={cn(
					'[grid-area:1/1]',
					contentClassName,
					isRevealing
						? 'login-gate-veil-content-revealing'
						: cn(
								'login-gate-veil-content overflow-hidden',
								MAX_HEIGHT_CLASS_NAMES[maxHeight]
							)
				)}
			>
				{children}
			</div>
			<div
				aria-hidden
				className={cn(
					'login-gate-shoji pointer-events-none [grid-area:1/1]',
					isRevealing && 'login-gate-shoji-revealing'
				)}
			/>
			<div
				className={cn(
					'pointer-events-none z-10 flex items-center justify-center p-3 [grid-area:1/1]',
					isRevealing &&
						'opacity-0 transition-opacity duration-200 motion-reduce:transition-none'
				)}
			>
				<div className="pointer-events-auto max-w-full">
					{overlay ?? (
						<p className="login-gate-count-tag">
							{t(
								count === 1
									? `loginGate.count.${countKind}.one`
									: `loginGate.count.${countKind}.other`,
								{ count }
							)}
						</p>
					)}
				</div>
			</div>
		</div>
	);
});
