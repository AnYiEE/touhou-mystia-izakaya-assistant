import { cn } from '@heroui/theme';
import { memo } from 'react';

import Button from '@/design/ui/components/button';

import { MoveButton } from '@/features/catalog/guests/shared/client/components/moveButton';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	className?: HTMLDivElementAttributes['className'];
	isMoveDownDisabled: boolean;
	isMoveUpDisabled: boolean;
	isReorderVisible: boolean;
	onMoveDown: () => void;
	onMoveUp: () => void;
	onRemove: () => void;
	onSelect: () => void;
	removeButtonClassName?: HTMLDivElementAttributes['className'];
	reorderButtonsClassName?: HTMLDivElementAttributes['className'];
	selectButtonClassName?: HTMLDivElementAttributes['className'];
}

export default memo<IProps>(function SavedMealActionRail({
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
}) {
	const { t } = useI18n(catalogGuestsMessages);

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
				{t('guests.savedMeal.select')}
			</Button>
			<Button
				fullWidth
				color="danger"
				size="sm"
				variant="flat"
				onPress={onRemove}
				className={cn('md:w-auto', removeButtonClassName)}
			>
				{t('guests.savedMeal.delete')}
			</Button>
		</div>
	);
});
