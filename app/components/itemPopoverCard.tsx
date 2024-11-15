import {
	type ElementRef,
	type FC,
	type HTMLAttributes,
	type KeyboardEvent,
	type MouseEvent,
	type PropsWithChildren,
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {isNil} from 'lodash';
import {twJoin, twMerge} from 'tailwind-merge';

import {useParams} from '@/hooks';
import {openedPopoverParam} from '@/hooks/useOpenedItemPopover';
import {inNewWindowParam, useViewInNewWindow} from '@/hooks/useViewInNewWindow';

import {PopoverContent, PopoverTrigger, type PopoverTriggerProps, Snippet, usePopoverContext} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faLink, faShare, faXmark} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite, {type ISpriteProps} from '@/components/sprite';
import TagsComponent from '@/components/tags';
import Tooltip from '@/components/tooltip';

import {siteConfig} from '@/configs';
import {
	type ICooker,
	type IIngredient,
	LABEL_DLC_0,
	type TCookerNames,
	type TIngredientNames,
	type TItemNames,
	type TTags,
} from '@/data';
import type {ITagStyle} from '@/data/types';
import {globalStore as store} from '@/stores';
import {checkA11yConfirmKey, union} from '@/utils';

const {name: siteName} = siteConfig;

interface ICloseButtonProps {}

const CloseButton: FC<ICloseButtonProps> = () => {
	const [params, replace] = useParams();
	const {getBackdropProps} = usePopoverContext();

	const isInNewWindow = params.has(inNewWindowParam);

	const handleClose = useCallback(
		(event: KeyboardEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>) => {
			if (!checkA11yConfirmKey(event)) {
				return;
			}

			getBackdropProps().onClick?.(event as MouseEvent<HTMLButtonElement>);

			if (isInNewWindow) {
				globalThis.close();
			}

			if (params.has(openedPopoverParam)) {
				const newParams = new URLSearchParams(params);

				newParams.delete(openedPopoverParam);
				replace(newParams);
			}
		},
		[getBackdropProps, isInNewWindow, params, replace]
	);

	const label = `点击：关闭${isInNewWindow ? '窗口' : '弹出框'}`;

	return (
		<Tooltip showArrow content={label} offset={-5} placement="left" size="sm">
			<FontAwesomeIconButton
				icon={faXmark}
				variant="light"
				onClick={handleClose}
				onKeyDown={handleClose}
				aria-label={label}
				className="absolute -right-1 top-1 h-4 text-default-200 transition-opacity data-[hover=true]:bg-transparent data-[hover=true]:opacity-hover"
			/>
		</Tooltip>
	);
};
interface IShareButtonProps {
	name: TItemNames;
}

const ShareButton = memo<IShareButtonProps>(function ShareButton({name}) {
	const [params] = useParams();
	const [isCanShare, setIsCanShare] = useState(false);
	const [shareObject, setShareObject] = useState<ShareData>({});

	const generatedUrl = useMemo(() => {
		const newParams = new URLSearchParams(params);

		newParams.set(openedPopoverParam, name);

		return `${location.origin}${location.pathname}?${newParams.toString()}`;
	}, [name, params]);

	useEffect(() => {
		const text = `在${siteName}上查看【${name}】的详情`;
		const currentShareObject = {
			text,
			title: text,
			url: generatedUrl,
		};

		setShareObject(currentShareObject);

		try {
			// For checking if the browser supports the share API.
			setIsCanShare(navigator.canShare(currentShareObject));
		} catch {
			/* empty */
		}
	}, [generatedUrl, name]);

	const handlePress = useCallback(() => {
		if (isCanShare) {
			navigator.share(shareObject).catch(() => {});
		}
	}, [isCanShare, shareObject]);

	const label = '点击：分享当前选中项的链接';

	return (
		<Popover showArrow>
			<Tooltip showArrow content={label} offset={-2} placement="left" size="sm">
				<div className="absolute -right-1 bottom-1 flex">
					<PopoverTrigger>
						<FontAwesomeIconButton
							icon={faShare}
							variant="light"
							onPress={handlePress}
							aria-label={label}
							className="h-4 text-default-200 transition-opacity data-[hover=true]:bg-transparent data-[hover=true]:opacity-hover"
						/>
					</PopoverTrigger>
				</div>
			</Tooltip>
			<PopoverContent>
				<p className="mr-4 cursor-default select-none self-end text-right text-xs text-default-400">
					点击以复制到当前选中项的链接↓
				</p>
				<Snippet
					disableTooltip
					size="sm"
					symbol={<FontAwesomeIcon icon={faLink} className="mr-1 !align-middle text-default-400" />}
					classNames={{
						pre: 'flex max-w-screen-p-60 items-center whitespace-normal break-all',
					}}
				>
					{generatedUrl}
				</Snippet>
			</PopoverContent>
		</Popover>
	);
});

interface ITriggerProps extends PopoverTriggerProps, HTMLAttributes<HTMLButtonElement> {}

const Trigger = memo<ITriggerProps>(function Trigger({className, ...props}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<PopoverTrigger
			className={twMerge(
				isHighAppearance &&
					'aria-expanded:bg-background/40 aria-expanded:opacity-100 aria-expanded:backdrop-blur dark:aria-expanded:bg-content1/40',
				className
			)}
			{...props}
		/>
	);
});

interface IItemPopoverCardProps extends Pick<ISpriteProps, 'target'> {
	// Basic info.
	id: number;
	name: TItemNames;
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
	cooker?: TCookerNames | null;
	ingredients?: TIngredientNames[];
	// For tags.
	tags?: {
		[key in keyof ITagStyle]: TTags[];
	};
	tagColors?: ITagStyle;
}

const ItemPopoverCardComponent = memo(
	forwardRef<ElementRef<'div'>, PropsWithChildren<IItemPopoverCardProps>>(function ItemPopoverCard(
		{children, cooker, description, displayName, dlc, id, ingredients, name, tagColors, tags, target},
		ref
	) {
		const openWindow = useViewInNewWindow();

		const mergedTags = useMemo((): Omit<NonNullable<typeof tags>, 'beverage'> | null => {
			if (tags === undefined) {
				return null;
			}

			const mergedTagValues = union(tags.beverage ?? [], tags.positive ?? []);
			const {beverage: _beverage, ...rest} = tags;

			return {
				...rest,
				positive: mergedTagValues,
			};
		}, [tags]);

		const hasTag = Boolean(
			(mergedTags?.positive && mergedTags.positive.length > 0) ||
				(mergedTags?.negative && mergedTags.negative.length > 0)
		);

		const dlcLabel = dlc === 0 ? LABEL_DLC_0 : '';

		return (
			<div className="max-w-80 space-y-2 p-2 text-xs text-default-400 dark:text-default-500" ref={ref}>
				<div className="flex items-center gap-2 text-sm text-default-700">
					<Sprite
						target={target}
						name={name}
						size={2}
						className={twJoin(
							'transition-transform hover:scale-150',
							target === 'partner' && 'rounded-full'
						)}
					/>
					<p className="font-bold">
						{dlc !== undefined && (
							<Popover showArrow isTriggerDisabled={!dlcLabel} offset={4} size="sm">
								<Tooltip showArrow content={dlcLabel} isDisabled={!dlcLabel} offset={2} size="sm">
									<span className={twJoin(!dlcLabel && 'cursor-text')}>
										<PopoverTrigger>
											<span
												role={dlcLabel ? 'button' : undefined}
												tabIndex={dlcLabel ? 0 : undefined}
												title={dlcLabel}
												className="opacity-100"
											>
												【
												<span className={twJoin(dlcLabel && 'underline-dotted-linear')}>
													DLC{dlc}
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
						<Tooltip showArrow content={cooker} size="sm">
							<Sprite target="cooker" name={cooker} size={1.5} className="mr-4" />
						</Tooltip>
						{ingredients.map((ingredient, index) => {
							const ingredientLabel = `点击：在新窗口中查看食材【${ingredient}】的详情`;
							return (
								<Tooltip showArrow key={index} content={ingredientLabel} size="sm">
									<Sprite
										target="ingredient"
										name={ingredient}
										size={1.5}
										onClick={() => {
											openWindow('ingredients', ingredient);
										}}
										onKeyDown={(event) => {
											if (checkA11yConfirmKey(event)) {
												openWindow('ingredients', ingredient);
											}
										}}
										aria-label={ingredientLabel}
										role="button"
										tabIndex={0}
										className="cursor-pointer"
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
							<Price showSymbol={false}>{description.price}</Price>
						</p>
					)}
					{description.level !== undefined && (
						<p>
							<span className="font-semibold">等级：</span>
							<Price showSymbol={false}>{description.level}</Price>
						</p>
					)}
					{description.type !== undefined && (
						<p>
							<span className="font-semibold">类别：</span>
							{[description.type].flat().join('、')}
						</p>
					)}
					<p>
						<span className="font-semibold">{target === 'recipe' ? '料理（非食谱）' : ''}ID：</span>
						<Price showSymbol={false}>{id}</Price>
					</p>
				</div>
				{hasTag && (
					<div className="flex flex-wrap gap-x-2 gap-y-1">
						<TagsComponent tags={mergedTags?.positive} tagStyle={tagColors?.positive} tagType="positive" />
						<TagsComponent tags={mergedTags?.negative} tagStyle={tagColors?.negative} tagType="negative" />
					</div>
				)}
				<p className={twJoin('break-all text-justify', mergedTags === null && '!mt-1')}>
					<span className="font-semibold">简介：</span>
					{description.description}
				</p>
				{children !== undefined && <div className="!mt-1 space-y-1">{children}</div>}
			</div>
		);
	})
);

const ItemPopoverCard = ItemPopoverCardComponent as typeof ItemPopoverCardComponent & {
	CloseButton: typeof CloseButton;
	ShareButton: typeof ShareButton;
	Trigger: typeof Trigger;
};

ItemPopoverCard.CloseButton = CloseButton;
ItemPopoverCard.ShareButton = ShareButton;
ItemPopoverCard.Trigger = Trigger;

export default ItemPopoverCard;
