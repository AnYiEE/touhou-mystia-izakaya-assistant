import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type MouseEventHandler, memo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';

import { useI18n } from '@/shared/i18n/useI18n';

const moveButtonDirectionMap = { down: 0, up: 1 } as const;

type TMoveButtonDirection = ExtractCollectionValue<
	typeof moveButtonDirectionMap
>;

export interface IMoveButtonProps {
	direction: TMoveButtonDirection;
	isDisabled: boolean;
	onClick?: MouseEventHandler<HTMLButtonElement>;
}

const MoveButtonComponent = memo<IMoveButtonProps>(function MoveButton({
	direction,
	isDisabled,
	onClick,
}) {
	const { t } = useI18n(catalogGuestsMessages);
	const label =
		direction === moveButtonDirectionMap.down
			? isDisabled
				? t('guests.move.last')
				: t('guests.move.down')
			: isDisabled
				? t('guests.move.first')
				: t('guests.move.up');

	return (
		<Tooltip
			showArrow
			content={label}
			offset={5}
			placement="left"
			size="sm"
		>
			<button
				type="button"
				disabled={isDisabled}
				onClick={onClick}
				aria-label={label}
				className={cn(
					'inline-flex cursor-pointer border-0 bg-transparent p-0 text-default transition-colors hover:text-default-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:text-default-400 motion-reduce:transition-none',
					{
						'cursor-not-allowed hover:text-default-200 focus-visible:outline-none active:text-default-200':
							isDisabled,
					}
				)}
			>
				<FontAwesomeIcon
					icon={
						direction === moveButtonDirectionMap.down
							? faArrowDown
							: faArrowUp
					}
					size="1x"
					aria-hidden
				/>
			</button>
		</Tooltip>
	);
});

export const MoveButton = MoveButtonComponent as typeof MoveButtonComponent & {
	direction: typeof moveButtonDirectionMap;
};

MoveButton.direction = moveButtonDirectionMap;
