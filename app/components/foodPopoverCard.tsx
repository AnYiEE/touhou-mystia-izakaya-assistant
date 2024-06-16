import {forwardRef, type PropsWithChildren, type ReactNode} from 'react';

import Sprite, {ISpriteProps} from '@/components/sprite';

import type {ITagStyle} from '@/constants/types';
import {type FoodNames, type IngredientNames, type KitchenwareNames} from '@/data';

type TagStyle = Omit<ITagStyle, 'beverage'>;

interface IProps extends Pick<ISpriteProps, 'target'> {
	name: FoodNames;
	description?: ReactNode;
	dlc?: number | string;
	ingredients?: IngredientNames[];
	kitchenware?: KitchenwareNames;
	tags?: {
		[key in keyof TagStyle]: string[];
	};
	tagColors?: TagStyle;
}

const renderTags = (
	tags: NonNullable<IProps['tags']>[keyof TagStyle],
	tagColors: Partial<NonNullable<TagStyle[keyof TagStyle]>> = {}
) =>
	tags?.map((tag, index) => (
		<div
			key={index}
			className="max-w-1/5 rounded border-1 border-solid px-1"
			style={{
				backgroundColor: tagColors.backgroundColor ?? '#fff',
				borderColor: tagColors.borderColor ?? '#000',
				color: tagColors.color ?? 'inherit',
			}}
		>
			{tag}
		</div>
	));

export default forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function FoodPopoverCard(
	{target, name, description, dlc, ingredients, kitchenware, tags, tagColors, children},
	ref
) {
	return (
		<div className="flex max-w-64 flex-col p-2 text-xs" ref={ref}>
			<div className="flex items-center gap-x-2 text-sm">
				<Sprite target={target} name={name} size={32} />
				<span className="font-bold">
					{dlc !== undefined && `【DLC${dlc}】`}
					{name}
				</span>
			</div>
			{kitchenware && ingredients && (
				<div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
					<Sprite target="kitchenware" name={kitchenware} size={24} className="mr-4" />
					{ingredients.map((item) => (
						<Sprite key={item} target="ingredient" name={item} size={24} />
					))}
				</div>
			)}
			{description !== undefined && <div className="mt-2 flex gap-x-4 text-default-500">{description}</div>}
			{tags && (
				<div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 break-keep">
					{renderTags(tags.positive, tagColors?.positive)}
					{renderTags(tags.negative, tagColors?.negative)}
				</div>
			)}
			{children !== undefined && <div className="mt-2 flex flex-col gap-y-1 text-default-500">{children}</div>}
		</div>
	);
});
