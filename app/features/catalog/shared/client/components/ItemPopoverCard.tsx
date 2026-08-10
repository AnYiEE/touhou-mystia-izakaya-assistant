'use client';

import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useMemo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import type { ICooker } from '@/domain/data/cookers/schema';
import type { IIngredient } from '@/domain/data/ingredients/schema';
import type { TDlc } from '@/domain/data/shared/types';
import type { TTag } from '@/domain/data/tags/types';
import type { TItemName } from '@/domain/data/types';

import { type ITagStyle } from '@/features/catalog/presentation/tagStyles';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import Price from './Price';
import Sprite, { type ISpriteProps } from './Sprite';
import TagsComponent from './Tags';

interface IItemPopoverCardProps
	extends Pick<ISpriteProps, 'target'>, RefProps<HTMLDivElement> {
	// Basic info.
	id: number;
	name: TItemName;
	displayName?: ReactNodeWithoutBoolean;
	description: {
		description: string;
		level?: number;
		price?: number;
		type?: ICooker['type'] | IIngredient['type'];
	};
	dlc?: number;
	details?: ReactNodeWithoutBoolean;
	// For tags.
	tags?: { [key in keyof ITagStyle]: TTag[] };
	tagColors?: ITagStyle;
}

const ItemPopoverCard = memo<PropsWithChildren<IItemPopoverCardProps>>(
	function ItemPopoverCard({
		children,
		description,
		details,
		displayName,
		dlc,
		id,
		name,
		tagColors,
		tags,
		target,
		...props
	}) {
		const mergedTags = useMemo<Omit<
			NonNullable<typeof tags>,
			'beverage'
		> | null>(() => {
			if (tags === undefined) {
				return null;
			}

			const mergedTagValues = [
				...new Set(tags.beverage).union(new Set(tags.positive)),
			];
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
				{details}
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
