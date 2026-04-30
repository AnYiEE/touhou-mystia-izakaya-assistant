import { memo } from 'react';

import { Badge, Tooltip, cn } from '@/design/ui/components';

import PressElement from '@/components/pressElement';
import Sprite from '@/components/sprite';

import { type TIngredientName } from '@/data';

type TIngredientTabItemColor = 'danger' | 'default' | 'secondary' | 'success';

interface IInteractiveProps {
	badgeContent: string;
	color: TIngredientTabItemColor;
	isNoChange: boolean;
	kind: 'interactive';
	name: TIngredientName;
	onPress: () => void;
	scoreChange: number;
	tooltipContent: string;
}

interface IStaticProps {
	className?: string;
	kind: 'static';
	name: TIngredientName;
}

type TProps = IInteractiveProps | IStaticProps;

export default memo<TProps>(function IngredientTabItemPresenter(props) {
	if (props.kind === 'static') {
		const { className, name } = props;

		return (
			<div
				className={cn(
					'flex cursor-not-allowed flex-col items-center',
					className
				)}
			>
				<Sprite target="ingredient" name={name} size={3} />
				<span className="whitespace-nowrap text-center text-tiny">
					{name}
				</span>
			</div>
		);
	}

	const {
		badgeContent,
		color,
		isNoChange,
		name,
		onPress,
		scoreChange,
		tooltipContent,
	} = props;

	return (
		<Tooltip
			disableBlur
			showArrow
			closeDelay={0}
			color={color}
			content={tooltipContent}
			offset={scoreChange > 1 ? 10 : 7}
			size="sm"
		>
			<PressElement
				as="div"
				onPress={onPress}
				role="button"
				tabIndex={0}
				aria-label={tooltipContent}
				className={cn(
					'group flex cursor-pointer flex-col items-center transition motion-reduce:transition-none',
					{
						'opacity-40 brightness-50 hover:opacity-100 hover:brightness-100 dark:opacity-80 dark:hover:opacity-100':
							isNoChange,
					}
				)}
			>
				<Badge
					color={color}
					content={badgeContent}
					isInvisible={isNoChange}
					size="sm"
					classNames={{
						badge: cn('font-mono', {
							'brightness-125': scoreChange > 2,
							'scale-125 font-medium': scoreChange > 1,
						}),
						base: 'group-hover:drop-shadow-md',
					}}
				>
					<Sprite
						target="ingredient"
						name={name}
						size={3}
						className="transition group-hover:scale-105 motion-reduce:transition-none"
					/>
				</Badge>
				<span className="whitespace-nowrap text-center text-tiny text-default-800 transition-colors group-hover:text-default-900 motion-reduce:transition-none">
					{name}
				</span>
			</PressElement>
		</Tooltip>
	);
});
