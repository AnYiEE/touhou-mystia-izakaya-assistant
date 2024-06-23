import {
	forwardRef,
	memo,
	useCallback,
	useMemo,
	type FC,
	type MouseEvent,
	type PropsWithChildren,
	type ReactNode,
} from 'react';

import {Popover, PopoverContent, PopoverTrigger, Snippet, Tooltip, usePopoverContext} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faLink, faShare, faXmark} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Sprite, {ISpriteProps} from '@/components/sprite';
import TagsComponent from '@/components/tags';

import type {ITagStyle} from '@/constants/types';
import {type FoodNames, type IngredientNames, type KitchenwareNames, type Tags} from '@/data';
import {useParams} from '@/hooks';

interface ICloseButtonProps {
	param?: string;
}

const CloseButton: FC<ICloseButtonProps> = memo(
	forwardRef<HTMLButtonElement | null, ICloseButtonProps>(function FoodPopoverCardCloseButton({param}, ref) {
		const [params, replace] = useParams();
		const {getBackdropProps} = usePopoverContext();

		const handleClose = useCallback(
			(e: MouseEvent<HTMLButtonElement>) => {
				getBackdropProps()?.onClick?.(e);

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
					aria-label={label}
					onClick={handleClose}
					className="absolute -right-1 top-1 h-4 text-default-300 data-[hover]:bg-transparent"
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

			return `${window.location.origin}${window.location.pathname}?${decodeURIComponent(newParams.toString())}`;
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
								className="h-4 text-default-300 data-[hover]:bg-transparent"
							/>
						</PopoverTrigger>
					</div>
				</Tooltip>
				<PopoverContent>
					<div className="flex flex-col">
						<p className="cursor-default select-none self-end pr-4 text-xs text-default-300">
							点击以复制到当前选中项的链接↓
						</p>
						<Snippet
							disableTooltip
							size="sm"
							symbol={<FontAwesomeIcon icon={faLink} className="pr-1 !align-middle text-default-500" />}
						>
							{generateUrl}
						</Snippet>
					</div>
				</PopoverContent>
			</Popover>
		);
	})
);

interface IFoodPopoverCardProps extends Pick<ISpriteProps, 'target'> {
	name: FoodNames;
	description?: ReactNode;
	dlc?: number | string;
	ingredients?: IngredientNames[];
	kitchenware?: KitchenwareNames;
	tags?: {
		[key in keyof ITagStyle]: Tags[];
	};
	tagColors?: ITagStyle;
}

const FoodPopoverCardComponent: FC<PropsWithChildren<IFoodPopoverCardProps>> = memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IFoodPopoverCardProps>>(function FoodPopoverCard(
		{target, name, description, dlc, ingredients, kitchenware, tags, tagColors, children},
		ref
	) {
		const mergedTags = useMemo((): Omit<NonNullable<typeof tags>, 'beverage'> | undefined => {
			if (!tags) {
				return tags;
			}

			const mergedTagValues = [...new Set([...(tags.beverage ?? []), ...(tags.positive ?? [])])];
			const {beverage, ...rest} = tags;

			return {
				...rest,
				positive: mergedTagValues,
			};
		}, [tags]);

		return (
			<div className="flex max-w-64 flex-col p-2 text-xs" ref={ref}>
				<div className="flex items-center gap-x-2 text-sm">
					<Sprite target={target} name={name} size={2} />
					<p className="font-bold">
						{dlc !== undefined && `【DLC${dlc}】`}
						{name}
					</p>
				</div>
				{kitchenware && ingredients && (
					<div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
						<Sprite target="kitchenware" name={kitchenware} size={1.5} className="mr-4" />
						{ingredients.map((item) => (
							<Sprite key={item} target="ingredient" name={item} size={1.5} />
						))}
					</div>
				)}
				{description !== undefined && <div className="mt-2 flex gap-x-4 text-default-500">{description}</div>}
				{mergedTags && (
					<div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 break-keep">
						<TagsComponent tags={mergedTags.positive} tagStyle={tagColors?.positive} />
						<TagsComponent tags={mergedTags.negative} tagStyle={tagColors?.negative} />
					</div>
				)}
				{children !== undefined && (
					<div className="mt-2 flex flex-col gap-y-1 text-default-500">{children}</div>
				)}
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
