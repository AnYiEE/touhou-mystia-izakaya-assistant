import {type ElementRef, forwardRef, memo} from 'react';

import {cn} from '@nextui-org/react';

import PressElement, {type IPressProp} from '@/components/pressElement';

import {type TTag} from '@/data';
import type {TTagStyle} from '@/data/types';

interface ITagPropsBase {
	tagStyle?: Partial<TTagStyle> | undefined;
	tagType?: 'negative' | 'positive' | null | undefined;
}

interface ITagProps extends ITagPropsBase, HTMLSpanElementAttributes, Partial<IPressProp<HTMLSpanElement>> {
	tag: TTag | [TTag, string];
}

const Tag = memo(
	forwardRef<ElementRef<'span'>, ITagProps>(function Tag(
		{className, onClick, onKeyDown, onPress, tag, tagStyle = {}, tagType, ...props},
		ref
	) {
		const isArray = Array.isArray(tag);
		const tagDescription = isArray ? `（${tag[1]}）` : null;
		const tagName = isArray ? tag[0] : tag;

		return (
			<PressElement
				as="span"
				onClick={onClick}
				onKeyDown={onKeyDown}
				onPress={onPress}
				className={cn(
					'inline-block h-max w-max rounded border px-1',
					{
						'after:ml-0.5 after:font-normal after:content-["✘"]': tagType === 'negative',
						'before:mr-1 before:font-normal before:content-["⦁"]': tagType === 'positive',
					},
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
				{tagDescription !== null && (
					<span className="-mx-1 select-none text-tiny font-normal leading-none">{tagDescription}</span>
				)}
			</PressElement>
		);
	})
);

interface ITagsPropsBase extends ITagPropsBase {
	tags: TTag[] | undefined;
}

interface ITagsProps extends ITagsPropsBase, Pick<HTMLSpanElementAttributes, 'className'> {}

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
