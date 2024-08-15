import {type FC, type HTMLAttributes, type MouseEvent, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import type {TTagStyle} from '@/constants/types';
import {type TTags} from '@/data';

interface IHandleDoubleClick {
	handleDoubleClick?: ((tag: TTags, event: MouseEvent<HTMLSpanElement>) => void) | undefined;
}

interface ITagProps extends ITagPropsBase, IHandleDoubleClick, HTMLAttributes<HTMLSpanElement> {}

interface ITagPropsBase {
	tag: TTags | [TTags, string];
	tagStyle?: Partial<TTagStyle>;
}

const Tag: FC<ITagProps> = memo(
	forwardRef<HTMLSpanElement | null, ITagProps>(function Tag(
		{tag, tagStyle = {}, handleDoubleClick, className, ...props},
		ref
	) {
		const isArray = Array.isArray(tag);
		const tagDescription = isArray ? `（${tag[1]}）` : '';
		const tagName = isArray ? tag[0] : tag;

		return (
			<span
				className={twMerge('inline-block h-max w-max rounded border px-1', className)}
				style={{
					backgroundColor: tagStyle.backgroundColor ?? 'inherit',
					borderColor: tagStyle.borderColor ?? 'currentcolor',
					color: tagStyle.color ?? 'currentcolor',
				}}
				onDoubleClick={(event) => {
					handleDoubleClick?.(tagName, event);
				}}
				{...props}
				ref={ref}
			>
				{tagName}
				{tagDescription}
			</span>
		);
	})
);

interface ITagsPropsBase {
	tags: TTags[] | undefined;
	tagStyle?: Partial<TTagStyle> | undefined;
}

interface ITagsProps extends ITagsPropsBase, IHandleDoubleClick, Pick<HTMLAttributes<HTMLSpanElement>, 'className'> {}

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
