import { cn } from '@heroui/theme';
import { memo, useMemo } from 'react';

import Badge from '@/design/ui/components/badge';
import PressElement from '@/design/ui/components/pressElement';
import Tooltip from '@/design/ui/components/tooltip';

import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { TIngredientId } from '@/domain/data/ingredients/types';

import Sprite from '@/features/catalog/shared/client/components/Sprite';

type TIngredientTabItemColor = 'danger' | 'default' | 'secondary' | 'success';

interface IInteractiveProps {
	badgeContent: string;
	color: TIngredientTabItemColor;
	ingredient: TIngredientId;
	isNoChange: boolean;
	kind: 'interactive';
	onPress: () => void;
	scoreChange: number;
	tooltipContent: string;
}

interface IStaticProps {
	className?: string;
	ingredient: TIngredientId;
	kind: 'static';
}

type TProps = IInteractiveProps | IStaticProps;

const ingredientCatalog = IngredientCatalog.getInstance();

const InteractiveIngredientTabItem = memo<IInteractiveProps>(
	function InteractiveIngredientTabItem({
		badgeContent,
		color,
		ingredient,
		isNoChange,
		onPress,
		scoreChange,
		tooltipContent,
	}) {
		const name = ingredientCatalog.getPropsById(ingredient, 'name');
		const badgeClassNames = useMemo(
			() => ({
				badge: cn('font-mono', {
					'brightness-125': scoreChange > 2,
					'scale-125 font-medium': scoreChange > 1,
				}),
				base: 'group-hover:drop-shadow-md group-data-[pressed=true]:drop-shadow-md',
			}),
			[scoreChange]
		);

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
							'opacity-40 brightness-50 hover:opacity-100 hover:brightness-100 data-[pressed=true]:opacity-100 data-[pressed=true]:brightness-100 dark:opacity-80 dark:hover:opacity-100 dark:data-[pressed=true]:opacity-100':
								isNoChange,
						}
					)}
				>
					<Badge
						color={color}
						content={badgeContent}
						isInvisible={isNoChange}
						size="sm"
						classNames={badgeClassNames}
					>
						<Sprite
							target="ingredient"
							recordId={ingredient}
							size={3}
							className="transition group-hover:scale-105 group-data-[pressed=true]:scale-105 motion-reduce:transition-none"
						/>
					</Badge>
					<span className="whitespace-nowrap text-center text-tiny text-default-800 transition-colors group-hover:text-default-900 group-data-[pressed=true]:text-default-900 motion-reduce:transition-none">
						{name}
					</span>
				</PressElement>
			</Tooltip>
		);
	}
);

export default memo<TProps>(function IngredientTabItemPresenter(props) {
	if (props.kind === 'static') {
		const { className, ingredient } = props;
		const name = ingredientCatalog.getPropsById(ingredient, 'name');

		return (
			<div
				className={cn(
					'flex cursor-not-allowed flex-col items-center',
					className
				)}
			>
				<Sprite target="ingredient" recordId={ingredient} size={3} />
				<span className="whitespace-nowrap text-center text-tiny">
					{name}
				</span>
			</div>
		);
	}

	return <InteractiveIngredientTabItem {...props} />;
});
