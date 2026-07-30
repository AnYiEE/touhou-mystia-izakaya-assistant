'use client';

import { cn } from '@heroui/theme';
import { isNil } from 'lodash';
import { type PropsWithChildren, memo, useMemo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import type { ICooker } from '@/domain/data/cookers/schema';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { IIngredient } from '@/domain/data/ingredients/schema';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TTag } from '@/domain/data/tags/types';
import type { TItemName } from '@/domain/data/types';

import { type ITagStyle } from '@/features/catalog/presentation/tagStyles';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { union } from '@/shared/utilities/collections/union';

import Price from './Price';
import Sprite, { type ISpriteProps } from './Sprite';
import TagsComponent from './Tags';

interface IItemPopoverCardProps
	extends Pick<ISpriteProps, 'target'>, RefProps<HTMLDivElement> {
	// Basic info.
	id: number;
	recipeId?: number;
	name: TItemName;
	displayName?: ReactNodeWithoutBoolean;
	description: {
		description: string;
		level?: number;
		price?: number;
		type?: ICooker['type'] | IIngredient['type'];
	};
	dlc?: number;
	// For recipes.
	/** @description If `null`, it means that the recipe has no cooker (such as dark matter). */
	cooker?: TCookerName | null;
	ingredients?: TIngredientName[];
	// For tags.
	tags?: { [key in keyof ITagStyle]: TTag[] };
	tagColors?: ITagStyle;
}

const ItemPopoverCard = memo<PropsWithChildren<IItemPopoverCardProps>>(
	function ItemPopoverCard({
		children,
		cooker,
		description,
		displayName,
		dlc,
		id,
		ingredients,
		name,
		recipeId,
		tagColors,
		tags,
		target,
		...props
	}) {
		const openWindow = useViewInNewWindow();

		const mergedTags = useMemo<Omit<
			NonNullable<typeof tags>,
			'beverage'
		> | null>(() => {
			if (tags === undefined) {
				return null;
			}

			const mergedTagValues = union(
				tags.beverage ?? [],
				tags.positive ?? []
			);
			const { beverage: _beverage, ...rest } = tags;

			return { ...rest, positive: mergedTagValues };
		}, [tags]);

		const hasTag =
			(mergedTags?.positive !== undefined &&
				!checkLengthEmpty(mergedTags.positive)) ||
			(mergedTags?.negative !== undefined &&
				!checkLengthEmpty(mergedTags.negative));

		const dlcLabel =
			dlc === undefined ? '' : DLC_LABEL_MAP[dlc as TDlc].label;
		const dlcShortLabel =
			dlc === undefined ? '' : DLC_LABEL_MAP[dlc as TDlc].shortLabel;

		return (
			<div
				className="z-10 max-w-85 space-y-2 p-2 text-tiny text-default-800"
				{...props}
			>
				<div className="flex items-center gap-2 text-small text-foreground">
					<Sprite
						target={target}
						name={name}
						size={2}
						className={cn(
							'transition-transform hover:scale-150 motion-reduce:transition-none',
							{ 'rounded-full': target === 'partner' }
						)}
					/>
					<p className="font-bold">
						{dlc !== undefined && (
							<Popover
								showArrow
								isTriggerDisabled={!dlcShortLabel}
								offset={3}
								size="sm"
							>
								<Tooltip
									showArrow
									content={dlcLabel}
									isDisabled={!dlcShortLabel}
									offset={1}
									size="sm"
								>
									<span
										className={cn({
											'cursor-text': !dlcShortLabel,
										})}
									>
										<PopoverTrigger
											className={cn({
												[CLASSNAME_FOCUS_VISIBLE_OUTLINE]:
													dlcShortLabel,
											})}
										>
											<span
												role={
													dlcShortLabel
														? 'button'
														: undefined
												}
												tabIndex={
													dlcShortLabel
														? 0
														: undefined
												}
												title={dlcLabel}
												className="opacity-100"
											>
												【
												<span
													className={cn({
														'underline-dotted-linear':
															dlcShortLabel,
													})}
												>
													{dlcShortLabel || dlcLabel}
												</span>
												】
											</span>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{dlcLabel}</PopoverContent>
							</Popover>
						)}
						{displayName === undefined ? name : displayName}
					</p>
				</div>
				{!isNil(cooker) && ingredients !== undefined && (
					<div className="flex flex-wrap gap-x-2 gap-y-1">
						<Tooltip
							showArrow
							content={cooker}
							offset={1}
							size="sm"
						>
							<Sprite
								target="cooker"
								name={cooker}
								size={1.5}
								className="mr-4"
							/>
						</Tooltip>
						{ingredients.map((ingredient, index) => {
							const ingredientLabel = `点击：在新窗口中查看食材【${ingredient}】的详情`;
							return (
								<Tooltip
									showArrow
									key={index}
									content={ingredientLabel}
									offset={1}
									size="sm"
								>
									<Sprite
										target="ingredient"
										name={ingredient}
										size={1.5}
										onPress={() => {
											openWindow(
												'ingredients',
												ingredient
											);
										}}
										aria-label={ingredientLabel}
										role="button"
									/>
								</Tooltip>
							);
						})}
					</div>
				)}
				<div className="flex gap-4">
					{description.price !== undefined && (
						<p>
							<span className="font-semibold">售价：</span>
							<Price showSymbol={false}>
								{description.price}
							</Price>
						</p>
					)}
					{description.level !== undefined && (
						<p>
							<span className="font-semibold">等级：</span>
							<Price showSymbol={false}>
								{description.level}
							</Price>
						</p>
					)}
					{description.type !== undefined && (
						<p>
							<span className="font-semibold">类别：</span>
							{[description.type].flat().join('、')}
						</p>
					)}
					<p>
						<span className="font-semibold">
							{target === 'recipe' ? '料理' : ''}ID：
						</span>
						<Price showSymbol={false}>{id}</Price>
					</p>
					{recipeId !== undefined && recipeId !== -1 && (
						<p>
							<span className="font-semibold">食谱ID：</span>
							<Price showSymbol={false}>{recipeId}</Price>
						</p>
					)}
				</div>
				{hasTag && (
					<div className="flex flex-wrap gap-x-2 gap-y-1">
						<TagsComponent
							tags={mergedTags.positive}
							tagStyle={tagColors?.positive}
							tagType="positive"
						/>
						<TagsComponent
							tags={mergedTags.negative}
							tagStyle={tagColors?.negative}
							tagType="negative"
						/>
					</div>
				)}
				<p
					className={cn('break-all text-justify', {
						'!mt-1': mergedTags === null,
					})}
				>
					<span className="font-semibold">简介：</span>
					{description.description}
				</p>
				{children !== undefined && (
					<div className="!mt-1 space-y-1">{children}</div>
				)}
			</div>
		);
	}
);

export default ItemPopoverCard;
