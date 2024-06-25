import {forwardRef, memo, type FC, type HTMLAttributes, type MouseEvent} from 'react';
import clsx from 'clsx';

import type {TTagStyle} from '@/constants/types';
import type {TTags} from '@/data';

interface IHandleClick {
	handleClick?: ((tag: TTags, e?: MouseEvent<HTMLDivElement>) => void) | undefined;
}

interface ITagProps extends ITagPropsBase, IHandleClick, HTMLAttributes<HTMLDivElement> {}

interface ITagPropsBase {
	tag: TTags;
	tagStyle?: Partial<TTagStyle>;
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
	tags: TTags[] | undefined;
	tagStyle?: Partial<TTagStyle> | undefined;
}

interface ITagsProps extends ITagsPropsBase, IHandleClick {
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
