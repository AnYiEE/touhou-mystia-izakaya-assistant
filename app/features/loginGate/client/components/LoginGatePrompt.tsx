'use client';

import { faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type ReactNode, memo, useId } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';

import {
	useLoginGate,
	useLoginGateDisplayMode,
} from '@/features/loginGate/client/LoginGateContext';
import {
	type TLoginGateMessageKey,
	loginGateMessages,
} from '@/features/loginGate/client/messages';
import {
	type TLoginGateCountKind,
	type TLoginGateModuleKey,
} from '@/features/loginGate/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

const TITLE_MESSAGE_KEYS = {
	'catalog.itemDetails': 'loginGate.title.catalogItemDetails',
	'guest.details': 'loginGate.title.guestDetails',
	'meal.save': 'loginGate.title.mealSave',
	'recommendation.specialGuestPlans': 'loginGate.title.specialGuestPlans',
	'recommendation.suggestedMeals': 'loginGate.title.suggestedMeals',
} as const satisfies Record<TLoginGateModuleKey, TLoginGateMessageKey>;

/**
 * - `plain`: no surface of its own; for a section inside a host card.
 * - `card`: a paper card, e.g. centred on a veil or inside a popover.
 * - `bar`: a sticky footer for a scrolling host such as a modal.
 */
export type TLoginGatePromptVariant = 'bar' | 'card' | 'plain';

interface IProps {
	className?: string;
	/** Shows "N more …" as the heading instead of the module title. */
	count?: { kind: TLoginGateCountKind; value: number };
	/** Visible heading; defaults to the module title. */
	heading?: ReactNode;
	/** Leaves out the sign-in reason, for hosts that repeat the prompt. */
	isCompact?: boolean;
	moduleKey: TLoginGateModuleKey;
	/** Render even in full mode, for hosts that open it on demand (save). */
	shouldIgnoreMode?: boolean;
	variant?: TLoginGatePromptVariant;
}

export default memo<IProps>(function LoginGatePrompt({
	className,
	count,
	heading,
	isCompact = false,
	moduleKey,
	shouldIgnoreMode = false,
	variant = 'plain',
}) {
	const { t } = useI18n(loginGateMessages);
	const { isHighAppearance } = useDesignPreferences();
	const { isLoginPending, onLogin, onSuppress, primaryActionRef } =
		useLoginGate();
	const displayMode = useLoginGateDisplayMode();

	const headingId = useId();

	if (displayMode === 'full' && !shouldIgnoreMode) {
		return null;
	}

	const isRevealing = displayMode === 'revealing';

	return (
		<section
			aria-labelledby={headingId}
			data-login-gate-prompt={variant}
			className={cn(
				'text-left transition-opacity duration-200 motion-reduce:transition-none',
				variant === 'card' &&
					cn(
						'w-72 max-w-full rounded-large border border-default-200/70 p-3 shadow-medium dark:border-default-100/60',
						isHighAppearance
							? 'bg-content1/80 backdrop-blur-lg backdrop-saturate-150'
							: 'bg-content1'
					),
				variant === 'bar' &&
					cn(
						'sticky bottom-0 z-20 border-t border-default-200/70 py-3 dark:border-default-100/60',
						isHighAppearance
							? 'bg-content1/75 backdrop-blur-lg backdrop-saturate-150'
							: 'bg-content1'
					),
				isRevealing && 'pointer-events-none opacity-0',
				className
			)}
		>
			<div
				className={cn(
					variant === 'bar' &&
						'md:flex md:items-center md:justify-between md:gap-6'
				)}
			>
				<div className="min-w-0 space-y-1">
					<h3
						id={headingId}
						className="text-small font-semibold leading-5 text-foreground"
					>
						{heading ??
							(count === undefined
								? t(TITLE_MESSAGE_KEYS[moduleKey])
								: t(
										count.value === 1
											? `loginGate.count.${count.kind}.one`
											: `loginGate.count.${count.kind}.other`,
										{ count: count.value }
									))}
					</h3>
					{!isCompact && (
						<p className="text-cjk-flow text-tiny leading-5 text-default-700">
							{t('loginGate.reason')}
						</p>
					)}
				</div>
				<div
					className={cn(
						'flex flex-wrap items-center gap-x-1 gap-y-1.5',
						isCompact ? 'mt-2' : 'mt-2.5',
						variant === 'bar' && 'md:mt-0 md:shrink-0'
					)}
				>
					<Button
						ref={primaryActionRef}
						data-login-gate-primary
						color="primary"
						isLoading={isLoginPending}
						size="sm"
						startContent={
							isLoginPending ? undefined : (
								<FontAwesomeIcon icon={faRightToBracket} />
							)
						}
						variant="flat"
						onPress={onLogin}
					>
						{t('loginGate.action.login')}
					</Button>
					<Button
						size="sm"
						variant="light"
						onPress={onSuppress}
						className="px-2 text-default-700 data-[hover=true]:text-foreground"
					>
						{t('loginGate.action.suppress')}
					</Button>
				</div>
			</div>
		</section>
	);
});
