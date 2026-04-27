import { memo } from 'react';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';

import { Tooltip, cn } from '@/design/ui/components';

const moveButtonDirectionMap = { down: 0, up: 1 } as const;

type TMoveButtonDirection = ExtractCollectionValue<
	typeof moveButtonDirectionMap
>;

export interface IMoveButtonProps extends Pick<
	FontAwesomeIconProps,
	'onClick'
> {
	direction: TMoveButtonDirection;
	isDisabled: boolean;
}

const MoveButtonComponent = memo<IMoveButtonProps>(function MoveButton({
	direction,
	isDisabled,
	onClick,
}) {
	return (
		<Tooltip
			showArrow
			content={
				direction === moveButtonDirectionMap.down
					? isDisabled
						? '已是末项'
						: '下移此项'
					: isDisabled
						? '已是首项'
						: '上移此项'
			}
			offset={5}
			placement="left"
			size="sm"
		>
			<FontAwesomeIcon
				icon={
					direction === moveButtonDirectionMap.down
						? faArrowDown
						: faArrowUp
				}
				size="1x"
				onClick={onClick}
				role="button"
				className={cn(
					'cursor-pointer text-default transition-colors hover:text-default-400 motion-reduce:transition-none',
					{ 'cursor-not-allowed hover:text-default-200': isDisabled }
				)}
			/>
		</Tooltip>
	);
});

export const MoveButton = MoveButtonComponent as typeof MoveButtonComponent & {
	direction: typeof moveButtonDirectionMap;
};

MoveButton.direction = moveButtonDirectionMap;
