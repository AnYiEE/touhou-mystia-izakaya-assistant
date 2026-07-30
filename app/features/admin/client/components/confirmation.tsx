'use client';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { memo } from 'react';

import Button, { type IButtonProps } from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

interface IAdminConfirmButtonProps<TConfirmAction extends string> {
	children: ReactNodeWithoutBoolean;
	className?: IButtonProps['className'];
	color: IButtonProps['color'];
	confirmAction: TConfirmAction;
	confirmColor?: IButtonProps['color'];
	confirmLabel: string;
	icon: FontAwesomeIconProps['icon'];
	isDisabled?: boolean;
	isLoading: boolean;
	onConfirm: () => void;
	onOpenChange: (action: TConfirmAction | null) => void;
	openAction: TConfirmAction | null;
	size?: IButtonProps['size'];
}

function AdminConfirmButtonBase<TConfirmAction extends string>({
	children,
	className,
	color,
	confirmAction,
	confirmColor = 'danger',
	confirmLabel,
	icon,
	isDisabled,
	isLoading,
	onConfirm,
	onOpenChange,
	openAction,
	size,
}: IAdminConfirmButtonProps<TConfirmAction>) {
	const handleOpenChange = (isOpen: boolean) => {
		onOpenChange(isOpen ? confirmAction : null);
	};

	const handleCancelPress = () => {
		onOpenChange(null);
	};

	return (
		<Popover
			shouldBlockScroll
			showArrow
			isOpen={openAction === confirmAction}
			onOpenChange={handleOpenChange}
		>
			<PopoverTrigger>
				<Button
					className={className}
					color={color}
					isDisabled={isDisabled}
					isLoading={isLoading}
					size={size}
					startContent={
						isLoading ? null : (
							<FontAwesomeIcon icon={icon} className="w-3.5" />
						)
					}
					variant="flat"
				>
					{children}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="space-y-1 p-1">
				<Button
					fullWidth
					color={confirmColor}
					isDisabled={isLoading}
					size="sm"
					variant="ghost"
					onPress={onConfirm}
				>
					{confirmLabel}
				</Button>
				<Button
					fullWidth
					color="primary"
					size="sm"
					variant="ghost"
					onPress={handleCancelPress}
				>
					取消
				</Button>
			</PopoverContent>
		</Popover>
	);
}

export const AdminConfirmButton = memo(
	AdminConfirmButtonBase
) as typeof AdminConfirmButtonBase;
