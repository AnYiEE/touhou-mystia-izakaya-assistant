import {type ElementRef, type ForwardedRef, forwardRef, memo, useMemo} from 'react';

import {cn} from '@nextui-org/react';

import Button, {type IButtonProps} from '@/components/button';

import {type TTag} from '@/data';
import type {TTagStyle} from '@/data/types';

interface ITagPropsBase {
	tagStyle?: Partial<TTagStyle> | undefined;
	tagType?: 'negative' | 'positive' | null | undefined;
}

interface ITagProps extends ITagPropsBase, IButtonProps, Omit<HTMLSpanElementAttributes, keyof IButtonProps> {
	isButton?: boolean;
	tag: TTag | [TTag, string];
}

const Tag = memo(
	forwardRef<ElementRef<'span'>, ITagProps>(function Tag(
		{className, isButton, tag, tagStyle = {}, tagType, ...props},
		ref
	) {
		const isArray = Array.isArray(tag);
		const tagDescription = isArray ? `（${tag[1]}）` : null;
		const tagName = isArray ? tag[0] : tag;

		const baseClassName = cn('inline-block h-max w-max rounded border px-1', {
			'after:ml-0.5 after:font-normal after:content-["✘"]': tagType === 'negative',
			'before:mr-1 before:font-normal before:content-["⦁"]': tagType === 'positive',
		});

		const baseStyle = useMemo(
			() =>
				({
					backgroundColor: tagStyle.backgroundColor ?? 'inherit',
					borderColor: tagStyle.borderColor ?? 'currentcolor',
					color: tagStyle.color ?? 'currentcolor',
				}) as const,
			[tagStyle.backgroundColor, tagStyle.borderColor, tagStyle.color]
		);

		const children = useMemo(
			() => (
				<>
					{tagName}
					{tagDescription !== null && (
						<span className="-mx-1 select-none text-tiny font-normal leading-none">{tagDescription}</span>
					)}
				</>
			),
			[tagDescription, tagName]
		);

		return isButton ? (
			<Button
				as="span"
				disableAnimation
				variant="light"
				className={cn(
					'inline-block min-w-max select-auto rounded-none px-0 text-base data-[pressed=true]:scale-100 data-[hover=true]:bg-transparent',
					baseClassName,
					className
				)}
				style={baseStyle}
				{...props}
				ref={ref as ForwardedRef<HTMLButtonElement | null>}
			>
				{children}
			</Button>
		) : (
			<span className={cn(baseClassName, className)} style={baseStyle} {...props} ref={ref}>
				{children}
			</span>
		);
	})
);

interface ITagsPropsBase extends ITagPropsBase {
	tags: TTag[] | undefined;
}

interface ITagsProps extends ITagsPropsBase, Pick<HTMLSpanElementAttributes, 'className'> {}

const TagsComponent = memo<ITagsProps>(function Tags({className, tagStyle = {}, tagType, tags}) {
	return tags !== undefined && tags.length > 0
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
