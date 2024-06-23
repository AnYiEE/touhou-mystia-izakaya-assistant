import {forwardRef, memo, type FC, type HTMLAttributes, type MouseEvent} from 'react';
import clsx from 'clsx';

import type {TagStyle} from '@/constants/types';
import type {Tags} from '@/data';

interface HandleClick {
	handleClick?: ((tag: Tags, e?: MouseEvent<HTMLDivElement>) => void) | undefined;
}

interface ITagProps extends ITagPropsBase, HandleClick, HTMLAttributes<HTMLDivElement> {}

interface ITagPropsBase {
	tag: Tags;
	tagStyle?: Partial<TagStyle>;
}

const Tag: FC<ITagProps> = memo(
	forwardRef<HTMLDivElement | null, ITagProps>(function Tag(
		{tag, tagStyle = {}, handleClick, className, ...props},
		ref
	) {
		return (
			<div
				className={clsx('max-w-1/5 rounded border-1 border-solid px-1', className)}
				style={{
					backgroundColor: tagStyle.backgroundColor ?? '#fff',
					borderColor: tagStyle.borderColor ?? '#000',
					color: tagStyle.color ?? 'inherit',
				}}
				onClick={(e) => {
					handleClick?.(tag, e);
				}}
				{...props}
				ref={ref}
			>
				{tag}
			</div>
		);
	})
);

interface ITagsPropsBase {
	tags: Tags[] | undefined;
	tagStyle?: Partial<TagStyle> | undefined;
}

interface ITagsProps extends ITagsPropsBase, HandleClick {
	className?: string;
}

const TagsComponent: FC<ITagsProps> = memo(function Tags({tags, tagStyle = {}, handleClick, className}) {
	return (
		<>
			{tags &&
				tags.length > 0 &&
				tags.map((tag, index) => (
					<Tag
						key={tag + index}
						tag={tag}
						tagStyle={tagStyle}
						handleClick={handleClick}
						className={className}
					/>
				))}
		</>
	);
});

const Tags = TagsComponent as typeof TagsComponent & {
	Tag: typeof Tag;
};

Tags.Tag = Tag;

export default Tags;
