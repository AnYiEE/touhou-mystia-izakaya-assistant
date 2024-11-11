import {type ElementRef, type HTMLAttributes, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {type TTags} from '@/data';
import type {TTagStyle} from '@/data/types';

interface ITagPropsBase {
	tagStyle?: Partial<TTagStyle> | undefined;
	tagType?: 'negative' | 'positive' | null | undefined;
}

interface ITagProps extends ITagPropsBase, HTMLAttributes<HTMLSpanElement> {
	tag: TTags | [TTags, string];
}

const Tag = memo(
	forwardRef<ElementRef<'span'>, ITagProps>(function Tag({className, tag, tagStyle = {}, tagType, ...props}, ref) {
		const isArray = Array.isArray(tag);
		const tagDescription = isArray ? `（${tag[1]}）` : '';
		const tagName = isArray ? tag[0] : tag;

		return (
			<span
				className={twMerge(
					'inline-block h-max w-max rounded border px-1',
					tagType === 'negative'
						? 'after:ml-0.5 after:content-["✘"]'
						: tagType === 'positive'
							? 'before:mr-1 before:content-["⦁"]'
							: '',
					className
				)}
				style={{
					backgroundColor: tagStyle.backgroundColor ?? 'inherit',
					borderColor: tagStyle.borderColor ?? 'currentcolor',
					color: tagStyle.color ?? 'currentcolor',
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

interface ITagsPropsBase extends ITagPropsBase {
	tags: TTags[] | undefined;
}

interface ITagsProps extends ITagsPropsBase, Pick<HTMLAttributes<HTMLSpanElement>, 'className'> {}

const TagsComponent = memo<ITagsProps>(function Tags({className, tagStyle = {}, tagType, tags}) {
	return tags && tags.length > 0
		? tags.map((tag, index) => (
				<Tag key={index} tag={tag} tagStyle={tagStyle} tagType={tagType} className={className} />
			))
		: null;
});

const Tags = TagsComponent as typeof TagsComponent & {
	Tag: typeof Tag;
};

Tags.Tag = Tag;

export default Tags;
