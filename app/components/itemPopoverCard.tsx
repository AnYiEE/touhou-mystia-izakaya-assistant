'use client';

import {
	type FC,
	type MouseEvent,
	type PropsWithChildren,
	memo,
	useCallback,
	useMemo,
} from 'react';
import { debounce, isNil } from 'lodash';

import { useParams } from '@/hooks';
import { PARAM_SPECIFY } from '@/hooks/useOpenedItemPopover';
import { PARAM_PREVIEW, useViewInNewWindow } from '@/hooks/useViewInNewWindow';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faShare, faXmark } from '@fortawesome/free-solid-svg-icons';

import {
	CLASSNAME_FOCUS_VISIBLE_OUTLINE,
	type IPopoverProps,
	Popover,
	PopoverContent,
	PopoverTrigger,
	type PopoverTriggerProps,
	Snippet,
	Tooltip,
	cn,
	usePopoverContext,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Price from '@/components/price';
import SiteInfo from '@/components/siteInfo';
import Sprite, { type ISpriteProps } from '@/components/sprite';
import TagsComponent from '@/components/tags';

import { siteConfig } from '@/configs';
import {
	DLC_LABEL_MAP,
	type ICooker,
	type IIngredient,
	type TCookerName,
	type TDlc,
	type TIngredientName,
	type TItemName,
	type TTag,
} from '@/data';
import type { ITagStyle } from '@/data/types';
import { globalStore as store } from '@/stores';
import {
	type TPressEvent,
	checkA11yConfirmKey,
	checkLengthEmpty,
	union,
} from '@/utilities';

const { name: siteName } = siteConfig;

interface ICloseButtonProps {}

const CloseButton: FC<ICloseButtonProps> = () => {
	const { params, replaceState } = useParams();
	const { getBackdropProps } = usePopoverContext();

	const isPreviewMode = params.has(PARAM_PREVIEW);

	const handleClose = useCallback(
		(event: TPressEvent<HTMLButtonElement>) => {
			getBackdropProps().onClick?.(
				event as MouseEvent<HTMLButtonElement>
			);

			if (isPreviewMode) {
				globalThis.close();
			}

			if (params.has(PARAM_SPECIFY)) {
				const newParams = new URLSearchParams(params);

				newParams.delete(PARAM_SPECIFY);
				replaceState(newParams);
			}
		},
		[getBackdropProps, isPreviewMode, params, replaceState]
	);

	const label = `点击：关闭${isPreviewMode ? '窗口' : '弹出框'}`;

	return (
		<Tooltip
			showArrow
			content={label}
			offset={3}
			placement="left"
			size="sm"
		>
			<FontAwesomeIconButton
				icon={faXmark}
				variant="light"
				onClick={handleClose}
				onKeyDown={debounce(checkA11yConfirmKey(handleClose))}
				aria-label={label}
				className="absolute right-1 top-1 z-20 h-4 w-4 min-w-0 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
			/>
		</Tooltip>
	);
};

interface IShareButtonProps {
	name: TItemName;
}

const ShareButton = memo<IShareButtonProps>(function ShareButton({ name }) {
	const { params } = useParams();

	const generatedUrl = useMemo(() => {
		const newParams = new URLSearchParams(params);

		newParams.set(PARAM_SPECIFY, name);

		return `${location.origin}${location.pathname}?${newParams.toString()}`;
	}, [name, params]);

	const shareObject = useMemo<ShareData>(() => {
		const text = `在${siteName}上查看【${name}】的详情`;

		return { text, title: text, url: generatedUrl };
	}, [generatedUrl, name]);

	const isCanShare = useMemo(() => {
		try {
			// For checking if the browser supports the share API.
			return navigator.canShare(shareObject);
		} catch {
			return false;
		}
	}, [shareObject]);

	const handlePress = useCallback(() => {
		if (isCanShare) {
			navigator.share(shareObject).catch(() => {});
		}
		trackEvent(trackEvent.category.click, 'Share Button', name);
	}, [isCanShare, name, shareObject]);

	const label = '点击：分享到当前选中项的链接';

	return (
		<>
			<SiteInfo
				fontSize={7}
				className="absolute bottom-1 right-6 text-right [text-shadow:0px_0.5px_0.75px_rgba(0,0,0,0.15)]"
			/>
			<Popover showArrow>
				<Tooltip
					showArrow
					content={label}
					offset={5}
					placement="left"
					size="sm"
				>
					<div className="absolute bottom-1 right-1 z-20 flex">
						<PopoverTrigger>
							<FontAwesomeIconButton
								icon={faShare}
								variant="light"
								onPress={handlePress}
								aria-label={label}
								className="h-4 w-4 min-w-0 transform-gpu text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
							/>
						</PopoverTrigger>
					</div>
				</Tooltip>
				<PopoverContent>
					<p className="mr-4 cursor-default select-none self-end text-right text-tiny text-default-500">
						点击以复制到当前选中项的链接↓
					</p>
					<Snippet
						disableTooltip
						size="sm"
						symbol={
							<FontAwesomeIcon
								icon={faLink}
								className="mr-1 !align-middle text-default-700"
							/>
						}
						classNames={{
							pre: 'flex max-w-screen-p-60 items-center whitespace-normal break-all',
						}}
					>
						{generatedUrl}
					</Snippet>
				</PopoverContent>
			</Popover>
		</>
	);
});

const ItemPopover = memo<IPopoverProps>(function ItemPopover({
	classNames,
	...props
}) {
	return (
		<Popover
			classNames={{
				...classNames,
				content: cn('relative', classNames?.content),
			}}
			{...props}
		/>
	);
});

interface IItemPopoverTriggerProps
	extends PopoverTriggerProps, HTMLButtonElementAttributes {}

const ItemPopoverTrigger = memo<IItemPopoverTriggerProps>(function Trigger({
	className,
	...props
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<PopoverTrigger
			className={cn(
				{
					'aria-expanded:bg-background/40 aria-expanded:opacity-100 aria-expanded:backdrop-blur dark:aria-expanded:bg-content1/40':
						isHighAppearance,
				},
				className
			)}
			{...props}
		/>
	);
});

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

const ItemPopoverCardComponent = memo<PropsWithChildren<IItemPopoverCardProps>>(
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

const ItemPopoverCard =
	ItemPopoverCardComponent as typeof ItemPopoverCardComponent & {
		CloseButton: typeof CloseButton;
		ShareButton: typeof ShareButton;
		Popover: typeof ItemPopover;
		Trigger: typeof ItemPopoverTrigger;
		Content: typeof PopoverContent;
	};

ItemPopoverCard.CloseButton = CloseButton;
ItemPopoverCard.ShareButton = ShareButton;
ItemPopoverCard.Popover = ItemPopover;
ItemPopoverCard.Trigger = ItemPopoverTrigger;
ItemPopoverCard.Content = PopoverContent;

export default ItemPopoverCard;
