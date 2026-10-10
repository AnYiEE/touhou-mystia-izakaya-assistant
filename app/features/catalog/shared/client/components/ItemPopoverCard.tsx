'use client';

import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useMemo } from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import type { TDlc } from '@/domain/data/shared/types';
import type { TSpriteId, TSpriteTarget } from '@/domain/data/sprites/types';
import type { TItemName } from '@/domain/data/types';

import { type ITagStyle } from '@/features/catalog/presentation/tagStyles';
import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import Price from './Price';
import Sprite from './Sprite';
import TagsComponent from './Tags';

type TTagLabel = string;

interface IItemPopoverCardBase extends RefProps<HTMLDivElement> {
	// Basic info.
	description: {
		description: string;
		level?: number;
		price?: number;
		type?: string | string[];
	};
	descriptionLabel?: string;
	details?: ReactNodeWithoutBoolean;
	displayName?: ReactNodeWithoutBoolean;
	dlc?: number;
	name: TItemName;
	summaryDetails?: ReactNodeWithoutBoolean;
	// For tags.
	tagColors?: ITagStyle;
	tags?: { [key in keyof ITagStyle]: TTagLabel[] };
}

type TItemPopoverCardProps<T extends TSpriteTarget> = IItemPopoverCardBase & {
	id: TSpriteId<T>;
	target: T;
};

function ItemPopoverCard<T extends TSpriteTarget>({
	children,
	description,
	descriptionLabel,
	details,
	displayName,
	dlc,
	id,
	name,
	summaryDetails,
	tagColors,
	tags,
	target,
	...props
}: PropsWithChildren<TItemPopoverCardProps<T>>) {
	const { t } = useI18n(catalogSharedMessages);
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

	const dlcLabel = dlc === undefined ? '' : getDlcLabel(dlc as TDlc);
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
					recordId={id}
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
												dlcShortLabel ? 0 : undefined
											}
											title={dlcLabel}
											className="opacity-100"
										>
											{t('catalog.dlcTag.open')}
											<span
												className={cn({
													'underline-dotted-linear':
														dlcShortLabel,
												})}
											>
												{dlcShortLabel || dlcLabel}
											</span>
											{t('catalog.dlcTag.close')}
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
						<span className="font-semibold">
							{t('catalog.itemPopover.price')}
						</span>
						<Price showSymbol={false}>{description.price}</Price>
					</p>
				)}
				{description.level !== undefined && (
					<p>
						<span className="font-semibold">
							{t('catalog.itemPopover.level')}
						</span>
						<Price showSymbol={false}>{description.level}</Price>
					</p>
				)}
				{description.type !== undefined && (
					<p>
						<span className="font-semibold">
							{t('catalog.itemPopover.category')}
						</span>
						{[description.type]
							.flat()
							.join(t('catalog.itemPopover.typeSeparator'))}
					</p>
				)}
				<p>
					<span className="font-semibold">
						{t(
							target === 'food'
								? 'catalog.itemPopover.foodId'
								: 'catalog.itemPopover.id'
						)}
					</span>
					<Price showSymbol={false}>{id}</Price>
				</p>
				{summaryDetails}
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
				<span className="font-semibold">
					{descriptionLabel ?? t('catalog.itemPopover.description')}
					{t('catalog.itemPopover.labelSuffix')}
				</span>
				{description.description}
			</p>
			{children !== undefined && (
				<div className="!mt-1 space-y-1">{children}</div>
			)}
		</div>
	);
}

export default memo(ItemPopoverCard) as typeof ItemPopoverCard;
