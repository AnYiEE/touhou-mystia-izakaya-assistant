'use client';

import { Button, cn } from '@/design/ui/components';

import { MoveButton } from '@/(pages)/customer-shared/moveButton';

interface ISavedMealActionRailProps {
	className?: string;
	isMoveDownDisabled: boolean;
	isMoveUpDisabled: boolean;
	isReorderVisible: boolean;
	onMoveDown: () => void;
	onMoveUp: () => void;
	onRemove: () => void;
	onSelect: () => void;
	reorderButtonsClassName?: string;
	removeButtonClassName?: string;
	selectButtonClassName?: string;
}

export default function SavedMealActionRail({
	className,
	isMoveDownDisabled,
	isMoveUpDisabled,
	isReorderVisible,
	onMoveDown,
	onMoveUp,
	onRemove,
	onSelect,
	removeButtonClassName,
	reorderButtonsClassName,
	selectButtonClassName,
}: ISavedMealActionRailProps) {
	return (
		<div
			className={cn(
				'flex w-full flex-row-reverse items-center justify-center gap-2 md:w-auto',
				className
			)}
		>
			<div
				aria-hidden={!isReorderVisible}
				className={cn(
					'absolute -right-2 -top-1 flex flex-col gap-3 text-tiny text-primary/20 dark:text-default-100',
					{ hidden: !isReorderVisible },
					reorderButtonsClassName
				)}
			>
				<MoveButton
					direction={MoveButton.direction.up}
					isDisabled={isMoveUpDisabled}
					onClick={onMoveUp}
				/>
				<MoveButton
					direction={MoveButton.direction.down}
					isDisabled={isMoveDownDisabled}
					onClick={onMoveDown}
				/>
			</div>
			<Button
				fullWidth
				color="primary"
				size="sm"
				variant="flat"
				onPress={onSelect}
				className={cn('md:w-auto', selectButtonClassName)}
			>
				选择
			</Button>
			<Button
				fullWidth
				color="danger"
				size="sm"
				variant="flat"
				onPress={onRemove}
				className={cn('md:w-auto', removeButtonClassName)}
			>
				删除
			</Button>
		</div>
	);
}
