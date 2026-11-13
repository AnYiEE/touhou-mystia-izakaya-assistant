'use client';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo, useId, useRef } from 'react';

import Button, { type IButtonProps } from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import { accountMessages } from '@/features/account/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

import { AccountCollapseMotion } from './accountManager/accountPanelLayout';

interface IProps {
	ariaLabel?: IButtonProps['aria-label'];
	buttonLabel: ReactNodeWithoutBoolean;
	className?: IButtonProps['className'];
	color: IButtonProps['color'];
	confirmColor?: IButtonProps['color'];
	confirmLabel: ReactNodeWithoutBoolean;
	description?: ReactNodeWithoutBoolean;
	fullWidth?: boolean;
	icon: FontAwesomeIconProps['icon'];
	isCancelDisabled?: boolean;
	isDisabled: boolean;
	isIconOnly?: boolean;
	isInline?: boolean;
	isLoading: boolean;
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	onOpenChange: (isOpen: boolean) => void;
	portalContainer?: HTMLElement;
	radius?: IButtonProps['radius'];
	size?: IButtonProps['size'];
}

export default memo<IProps>(function AccountConfirmButton({
	ariaLabel,
	buttonLabel,
	className,
	color,
	confirmColor = 'danger',
	confirmLabel,
	description,
	fullWidth = true,
	icon,
	isCancelDisabled = false,
	isDisabled,
	isIconOnly,
	isInline = false,
	isLoading,
	isOpen,
	onCancel,
	onConfirm,
	onOpenChange,
	portalContainer,
	radius,
	size,
}) {
	const { t } = useI18n(accountMessages);
	const inlineConfirmationId = useId();
	const inlineTriggerRef = useRef<HTMLButtonElement>(null);
	const triggerButton = (
		<Button
			{...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel })}
			{...(isInline
				? {
						'aria-controls': inlineConfirmationId,
						'aria-expanded': isOpen,
						onPress: () => {
							if (!isDisabled && !isCancelDisabled) {
								onOpenChange(!isOpen);
							}
						},
					}
				: {})}
			{...(isInline ? { ref: inlineTriggerRef } : {})}
			fullWidth={fullWidth}
			className={cn(!isIconOnly && 'justify-start', className)}
			color={color}
			isDisabled={isDisabled}
			isIconOnly={isIconOnly}
			isLoading={isLoading}
			radius={radius}
			size={size}
			startContent={
				isLoading || isIconOnly ? null : (
					<FontAwesomeIcon icon={icon} className="w-4" />
				)
			}
			variant={isIconOnly ? 'light' : 'flat'}
		>
			{isIconOnly ? (
				<FontAwesomeIcon icon={icon} className="w-3.5" />
			) : (
				buttonLabel
			)}
		</Button>
	);

	if (isInline) {
		return (
			<>
				{triggerButton}
				<AccountCollapseMotion
					motionKey="account-confirm-inline"
					className="order-3 sm:col-span-2"
				>
					{isOpen ? (
						<div
							id={inlineConfirmationId}
							className="space-y-3 rounded-small border border-danger/20 bg-danger/5 p-3"
						>
							{description === undefined ? null : (
								<p className="text-tiny leading-5 text-foreground-600">
									{description}
								</p>
							)}
							<div className="grid grid-cols-2 gap-2">
								<Button
									fullWidth
									color={confirmColor}
									isDisabled={isDisabled}
									size="sm"
									variant="flat"
									onPress={onConfirm}
								>
									{confirmLabel}
								</Button>
								<Button
									fullWidth
									color="primary"
									isDisabled={isDisabled || isCancelDisabled}
									size="sm"
									variant="flat"
									onPress={() => {
										onCancel();
										requestAnimationFrame(() => {
											inlineTriggerRef.current?.focus();
										});
									}}
								>
									{t('account.manager.confirm.cancel')}
								</Button>
							</div>
						</div>
					) : null}
				</AccountCollapseMotion>
			</>
		);
	}

	return (
		<Popover
			isDismissable={!isDisabled && !isCancelDisabled}
			isKeyboardDismissDisabled={isDisabled || isCancelDisabled}
			shouldBlockScroll
			showArrow
			isOpen={isOpen}
			{...(portalContainer === undefined ? {} : { portalContainer })}
			onOpenChange={(nextOpen) => {
				if ((isDisabled || isCancelDisabled) && !nextOpen) {
					return;
				}
				onOpenChange(nextOpen);
			}}
		>
			<PopoverTrigger>{triggerButton}</PopoverTrigger>
			<PopoverContent className="w-72 max-w-[calc(100vw-2rem)] space-y-2 p-2">
				{description === undefined ? null : (
					<p className="px-1 text-tiny leading-5 text-foreground-600">
						{description}
					</p>
				)}
				<Button
					fullWidth
					color={confirmColor}
					isDisabled={isDisabled}
					size="sm"
					variant="ghost"
					onPress={onConfirm}
				>
					{confirmLabel}
				</Button>
				<Button
					fullWidth
					color="primary"
					isDisabled={isDisabled || isCancelDisabled}
					size="sm"
					variant="ghost"
					onPress={onCancel}
				>
					{t('account.manager.confirm.cancel')}
				</Button>
			</PopoverContent>
		</Popover>
	);
});
