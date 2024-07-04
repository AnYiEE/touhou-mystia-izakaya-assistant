import {type FC, type HTMLAttributes, type MouseEvent, forwardRef, memo} from 'react';
import clsx from 'clsx';

import type {TTagStyle} from '@/constants/types';
import type {TTags} from '@/data';

interface IHandleDoubleClick {
	handleDoubleClick?: ((tag: TTags, e: MouseEvent<HTMLDivElement>) => void) | undefined;
}

interface ITagProps extends ITagPropsBase, IHandleDoubleClick, HTMLAttributes<HTMLDivElement> {}

interface ITagPropsBase {
	tag: TTags;
	tagStyle?: Partial<TTagStyle>;
}

const Tag: FC<ITagProps> = memo(
	forwardRef<HTMLDivElement | null, ITagProps>(function Tag(
		{tag, tagStyle = {}, handleDoubleClick, className, ...props},
		ref
	) {
		return (
			<div
				className={clsx('max-w-1/5 rounded border-1 border-solid px-1', className)}
				style={{
					backgroundColor: tagStyle.backgroundColor ?? 'inherit',
					borderColor: tagStyle.borderColor ?? 'inherit',
					color: tagStyle.color ?? 'inherit',
				}}
				onDoubleClick={(e) => {
					handleDoubleClick?.(tag, e);
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
	tags: TTags[] | undefined;
	tagStyle?: Partial<TTagStyle> | undefined;
}

interface ITagsProps extends ITagsPropsBase, IHandleDoubleClick {
	className?: string;
}

const TagsComponent: FC<ITagsProps> = memo(function Tags({tags, tagStyle = {}, handleDoubleClick, className}) {
	return (
		<>
			{tags &&
				tags.length > 0 &&
				tags.map((tag) => (
					<Tag
						key={tag}
						tag={tag}
						tagStyle={tagStyle}
						handleDoubleClick={handleDoubleClick}
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
