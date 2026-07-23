'use client';

import { memo } from 'react';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

import {
	Button,
	type IButtonProps,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@/design/ui/components';

interface IProps {
	ariaLabel?: IButtonProps['aria-label'];
	buttonLabel: ReactNodeWithoutBoolean;
	className?: IButtonProps['className'];
	color: IButtonProps['color'];
	confirmColor?: IButtonProps['color'];
	confirmLabel: ReactNodeWithoutBoolean;
	fullWidth?: boolean;
	icon: FontAwesomeIconProps['icon'];
	isIconOnly?: boolean;
	isDisabled: boolean;
	isLoading: boolean;
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	onOpenChange: (isOpen: boolean) => void;
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
	fullWidth = true,
	icon,
	isDisabled,
	isIconOnly,
	isLoading,
	isOpen,
	onCancel,
	onConfirm,
	onOpenChange,
	radius,
	size,
}) {
	return (
		<Popover
			shouldBlockScroll
			showArrow
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<PopoverTrigger>
				<Button
					{...(ariaLabel === undefined
						? {}
						: { 'aria-label': ariaLabel })}
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
			</PopoverTrigger>
			<PopoverContent className="space-y-1 p-1">
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
					isDisabled={isDisabled}
					size="sm"
					variant="ghost"
					onPress={onCancel}
				>
					取消
				</Button>
			</PopoverContent>
		</Popover>
	);
});
