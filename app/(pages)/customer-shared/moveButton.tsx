import { type MouseEventHandler, memo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';

import { Tooltip, cn } from '@/design/ui/components';

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
	const label =
		direction === moveButtonDirectionMap.down
			? isDisabled
				? '已是末项'
				: '下移此项'
			: isDisabled
				? '已是首项'
				: '上移此项';

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
					'inline-flex cursor-pointer border-0 bg-transparent p-0 text-default transition-colors hover:text-default-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none',
					{
						'cursor-not-allowed hover:text-default-200 focus-visible:outline-none':
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
