import {
	type FC,
	type KeyboardEvent,
	type MouseEvent,
	type PropsWithChildren,
	forwardRef,
	memo,
	useCallback,
	useMemo,
} from 'react';

import {useParams} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger, Snippet, Tooltip, usePopoverContext} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faLink, faShare, faXmark} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Sprite, {type ISpriteProps} from '@/components/sprite';
import TagsComponent from '@/components/tags';

import type {ITagStyle} from '@/constants/types';
import {type IIngredient, type TCookerNames, type TFoodNames, type TIngredientNames, type TTags} from '@/data';
import {checkA11yConfirmKey, uniq} from '@/utils';

interface ICloseButtonProps {
	param?: string;
}

const CloseButton: FC<ICloseButtonProps> = memo(
	forwardRef<HTMLButtonElement | null, ICloseButtonProps>(function FoodPopoverCardCloseButton({param}, ref) {
		const [params, replace] = useParams();
		const {getBackdropProps} = usePopoverContext();

		const handleClose = useCallback(
			(event: KeyboardEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>) => {
				if (!checkA11yConfirmKey(event)) {
					return;
				}

				getBackdropProps().onClick?.(event as MouseEvent<HTMLButtonElement>);

				if (param && params.has(param)) {
					const newParams = new URLSearchParams(params);

					newParams.delete(param);
					replace(newParams);
				}
			},
			[getBackdropProps, param, params, replace]
		);

		const label = '关闭弹出框';

		return (
			<Tooltip showArrow content={label} offset={-5} placement="left">
				<FontAwesomeIconButton
					icon={faXmark}
					variant="light"
					onClick={handleClose}
					onKeyDown={handleClose}
					aria-label={label}
					className="absolute -right-1 top-1 h-4 text-default-300 data-[hover]:bg-transparent data-[hover]:text-default-400"
					ref={ref}
				/>
			</Tooltip>
		);
	})
);

interface IShareButtonProps {
	name: string;
	param: string;
}

const ShareButton: FC<IShareButtonProps> = memo(
	forwardRef<HTMLDivElement | null, IShareButtonProps>(function FoodPopoverCardShareButton({name, param}, ref) {
		const [params] = useParams();

		const generateUrl = useMemo(() => {
			const newParams = new URLSearchParams(params);

			newParams.set(param, name);

			return `${window.location.origin}${window.location.pathname}?${newParams.toString()}`;
		}, [name, param, params]);

		return (
			<Popover showArrow ref={ref}>
				<Tooltip showArrow content="分享当前选中项的链接" offset={-2} placement="left">
					<div className="absolute -right-1 bottom-0">
						<PopoverTrigger>
							<FontAwesomeIconButton
								icon={faShare}
								variant="light"
								aria-label="分享当前选中项"
								className="h-4 text-default-300 data-[hover]:bg-transparent data-[hover]:text-default-400"
							/>
						</PopoverTrigger>
					</div>
				</Tooltip>
				<PopoverContent>
					<p className="mr-4 cursor-default select-none self-end text-right text-xs text-default-500 dark:text-default-400">
						点击以复制到当前选中项的链接↓
					</p>
					<Snippet
						disableTooltip
						size="sm"
						symbol={<FontAwesomeIcon icon={faLink} className="mr-1 !align-middle text-default-500" />}
						classNames={{
							pre: 'flex max-w-[60vw] items-center whitespace-normal break-all',
						}}
					>
						{generateUrl}
					</Snippet>
				</PopoverContent>
			</Popover>
		);
	})
);

interface IFoodPopoverCardProps extends Pick<ISpriteProps, 'target'> {
	name: TFoodNames;
	description?: {
		level: number | string;
		price: number | string;
	};
	dlc?: number | string;
	cooker?: TCookerNames;
	ingredients?: TIngredientNames[];
	ingredientType?: IIngredient['type'];
	tags?: {
		[key in keyof ITagStyle]: TTags[];
	};
	tagColors?: ITagStyle;
}

const FoodPopoverCardComponent: FC<PropsWithChildren<IFoodPopoverCardProps>> = memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IFoodPopoverCardProps>>(function FoodPopoverCard(
		{target, name, description, dlc, cooker, ingredients, ingredientType, tags, tagColors, children},
		ref
	) {
		const mergedTags = useMemo((): Omit<NonNullable<typeof tags>, 'beverage'> | undefined => {
			if (!tags) {
				return tags;
			}

			const mergedTagValues = uniq([...(tags.beverage ?? []), ...(tags.positive ?? [])]);
			const {beverage: _beverage, ...rest} = tags;

			return {
				...rest,
				positive: mergedTagValues,
			};
		}, [tags]);

		return (
			<div className="max-w-64 space-y-2 p-2 text-xs text-default-500" ref={ref}>
				<div className="flex items-center gap-2 text-sm text-foreground">
					<Sprite target={target} name={name} size={2} />
					<p className="font-bold">
						{dlc !== undefined && `【DLC${dlc}】`}
						{name}
					</p>
				</div>
				{cooker && ingredients && (
					<div className="flex flex-wrap gap-x-2 gap-y-1">
						<Sprite target="cooker" name={cooker} size={1.5} className="mr-4" />
						{ingredients.map((item) => (
							<Sprite key={item} target="ingredient" name={item} size={1.5} />
						))}
					</div>
				)}
				{description !== undefined && (
					<div className="flex gap-4">
						<p>
							<span className="font-semibold">售价：</span>
							{description.price}
						</p>
						<p>
							<span className="font-semibold">等级：</span>
							{description.level}
						</p>
						{ingredientType !== undefined && (
							<p>
								<span className="font-semibold">种类：</span>
								{ingredientType}
							</p>
						)}
					</div>
				)}
				{mergedTags && (
					<div className="flex flex-wrap gap-x-2 gap-y-1">
						<TagsComponent tags={mergedTags.positive} tagStyle={tagColors?.positive} />
						<TagsComponent tags={mergedTags.negative} tagStyle={tagColors?.negative} />
					</div>
				)}
				{children !== undefined && <div className="space-y-1">{children}</div>}
			</div>
		);
	})
);

const FoodPopoverCard = FoodPopoverCardComponent as typeof FoodPopoverCardComponent & {
	CloseButton: typeof CloseButton;
	ShareButton: typeof ShareButton;
};

FoodPopoverCard.CloseButton = CloseButton;
FoodPopoverCard.ShareButton = ShareButton;

export default FoodPopoverCard;
