import {type PropsWithChildren, type ReactNode} from 'react';

import type {ITagStyle} from '@/constants/types';

import Sprite, {type ISpriteProps} from '@/components/sprite';

interface IProps extends PropsWithChildren {
	name: string;
	description?: ReactNode;
	dlc?: number | string;
	tags?: {
		[key in keyof ITagStyle]: string[];
	};
	tagColors?: ITagStyle;
}

export default function ItemPopoverCard({name, description, dlc, tags, tagColors, children}: IProps) {
	return (
		<div className="flex max-w-64 flex-col p-2 text-xs">
			<div className="flex items-center gap-x-2 text-sm">
				<Sprite name={name as NonNullable<ISpriteProps['name']>} size={32} />
				<span className="font-bold">
					{dlc !== undefined && `【DLC${dlc}】`}
					{name}
				</span>
			</div>
			{description !== undefined && <div className="mt-2 flex gap-x-4 text-default-500">{description}</div>}
			{tags && (
				<div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 break-keep">
					{tags.positive?.map((tag, index) => (
						<div
							key={index}
							className="max-w-1/5 rounded border-1 border-solid px-1"
							style={{
								backgroundColor: tagColors?.positive?.backgroundColor ?? '#fff',
								borderColor: tagColors?.positive?.borderColor ?? '#000',
								color: tagColors?.positive?.color ?? 'inherit',
							}}
						>
							{tag}
						</div>
					))}
					{tags.negative?.map((tag, index) => (
						<div
							key={index}
							className="max-w-1/5 rounded border-1 border-solid px-1"
							style={{
								backgroundColor: tagColors?.negative?.backgroundColor ?? '#fff',
								borderColor: tagColors?.negative?.borderColor ?? '#000',
								color: tagColors?.negative?.color ?? 'inherit',
							}}
						>
							{tag}
						</div>
					))}
					{tags.beverages?.map((tag, index) => (
						<div
							key={index}
							className="max-w-1/5 rounded border-1 border-solid px-1"
							style={{
								backgroundColor: tagColors?.beverages?.backgroundColor ?? '#fff',
								borderColor: tagColors?.beverages?.borderColor ?? '#000',
								color: tagColors?.beverages?.color ?? 'inherit',
							}}
						>
							{tag}
						</div>
					))}
				</div>
			)}
			{children !== undefined && <div className="mt-2 flex flex-col gap-y-1 text-default-500">{children}</div>}
		</div>
	);
}
