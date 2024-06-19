import {forwardRef, memo, type FC, type PropsWithChildren, type ReactNode} from 'react';

import {Tooltip, usePopoverContext} from '@nextui-org/react';
import {faXmark} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Sprite, {ISpriteProps} from '@/components/sprite';

import type {ITagStyle} from '@/constants/types';
import {type FoodNames, type IngredientNames, type KitchenwareNames} from '@/data';
import {useParams} from '@/hooks';

interface ICloseButtonProps {
	param?: string;
}

const CloseButton: FC<ICloseButtonProps> = memo(
	forwardRef<HTMLButtonElement | null, ICloseButtonProps>(function FoodPopoverCardCloseButton({param}, ref) {
		const [params, replace] = useParams();
		const {getBackdropProps} = usePopoverContext();

		const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
			getBackdropProps()?.onClick?.(e);

			if (param) {
				const newParams = new URLSearchParams(params);
				newParams.delete(param);
				replace(newParams);
			}
		};

		const label = '关闭弹出框';

		return (
			<Tooltip showArrow content={label} offset={-5} placement="left">
				<FontAwesomeIconButton
					icon={faXmark}
					variant="light"
					aria-label={label}
					onClick={handleClose}
					className="absolute -right-1 -top-1 text-default-300 data-[hover]:bg-transparent"
					ref={ref}
				/>
			</Tooltip>
		);
	})
);

type TagStyle = Omit<ITagStyle, 'beverage'>;

interface IFoodPopoverCardProps extends Pick<ISpriteProps, 'target'> {
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

function renderTags(
	tags: NonNullable<IFoodPopoverCardProps['tags']>[keyof TagStyle],
	tagColors: Partial<NonNullable<TagStyle[keyof TagStyle]>> = {}
) {
	return tags?.map((tag, index) => (
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
}

const FoodPopoverCardComponent: FC<PropsWithChildren<IFoodPopoverCardProps>> = memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IFoodPopoverCardProps>>(function FoodPopoverCard(
		{target, name, description, dlc, ingredients, kitchenware, tags, tagColors, children},
		ref
	) {
		return (
			<div className="flex max-w-64 flex-col p-2 text-xs" ref={ref}>
				<div className="flex items-center gap-x-2 text-sm">
					<Sprite target={target} name={name} size={32} />
					<p className="font-bold">
						{dlc !== undefined && `【DLC${dlc}】`}
						{name}
					</p>
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
				{children !== undefined && (
					<div className="mt-2 flex flex-col gap-y-1 text-default-500">{children}</div>
				)}
			</div>
		);
	})
);

const FoodPopoverCard = FoodPopoverCardComponent as typeof FoodPopoverCardComponent & {
	CloseButton: typeof CloseButton;
};

FoodPopoverCard.CloseButton = CloseButton;

export default FoodPopoverCard;
