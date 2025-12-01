'use client';

import { type JSX, memo, useCallback, useMemo } from 'react';

import { Button, type IButtonProps, cn } from '@/design/ui/components';

import {
	type HTMLElementClickEvent,
	type HTMLElementKeyDownEvent,
	type IPressProp,
} from '@/components/pressElement';

import { type TTag } from '@/data';
import type { ITagStyleConfig } from '@/data/types';
import { checkA11yConfirmKey, checkEmpty } from '@/utilities';

interface ITagPropsBase {
	tagStyle?: Partial<ITagStyleConfig> | undefined;
	tagType?: 'negative' | 'positive' | null | undefined;
}

interface ITagProps
	extends
		Omit<
			HTMLSpanElementAttributes,
			Exclude<keyof IButtonProps, 'onClick' | 'onKeyDown'>
		>,
		Omit<IButtonProps, 'onClick' | 'onKeyDown' | 'onPress'>,
		Partial<IPressProp<HTMLSpanElement>>,
		ITagPropsBase {
	isButton?: boolean;
	tag: TTag | [TTag, string] | JSX.Element;
}

const Tag = memo<ITagProps>(function Tag({
	className,
	isButton,
	onClick,
	onKeyDown,
	onPress,
	tag,
	tagStyle = {},
	tagType,
	...props
}) {
	const isArray = Array.isArray(tag);
	const tagDescription = isArray ? `（${tag[1]}）` : null;
	const tagName = isArray ? tag[0] : tag;

	const baseClassName = cn('inline-block h-max w-max rounded border px-1', {
		'after:ml-0.5 after:font-normal after:content-["✘"]':
			tagType === 'negative',
		'before:mr-1 before:font-normal before:content-["⦁"]':
			tagType === 'positive',
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
					<span className="-mx-1 select-none text-tiny font-normal leading-none">
						{tagDescription}
					</span>
				)}
			</>
		),
		[tagDescription, tagName]
	);

	const handleClick = useCallback(
		(event: HTMLElementClickEvent<HTMLButtonElement>) => {
			onClick?.(event);
			onPress?.(event);
		},
		[onClick, onPress]
	);

	const handleKeyDown = useCallback(
		(event: HTMLElementKeyDownEvent<HTMLButtonElement>) => {
			if (onKeyDown !== undefined) {
				checkA11yConfirmKey(onKeyDown)(event);
			}
			if (onPress !== undefined) {
				checkA11yConfirmKey(onPress)(event);
			}
		},
		[onKeyDown, onPress]
	);

	return isButton ? (
		<Button
			as="span"
			disableAnimation
			variant="light"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className={cn(
				'inline-block min-w-max select-auto rounded-none px-0 text-base !transition data-[pressed=true]:scale-100 data-[hover=true]:bg-transparent data-[pressed=true]:ring-1 data-[pressed=true]:ring-inset data-[pressed=true]:ring-current data-[pressed=true]:ring-offset-1 motion-reduce:!transition-none',
				baseClassName,
				className
			)}
			style={baseStyle}
			{...props}
		>
			{children}
		</Button>
	) : (
		<span
			className={cn(baseClassName, className)}
			style={baseStyle}
			{...props}
		>
			{children}
		</span>
	);
});

interface ITagsPropsBase extends ITagPropsBase {
	tags: TTag[] | undefined;
}

interface ITagsProps
	extends ITagsPropsBase, Pick<HTMLSpanElementAttributes, 'className'> {}

const TagsComponent = memo<ITagsProps>(function Tags({
	className,
	tagStyle = {},
	tagType,
	tags,
}) {
	return tags !== undefined && !checkEmpty(tags)
		? tags.map((tag, index) => (
				<Tag
					key={index}
					tag={tag}
					tagStyle={tagStyle}
					tagType={tagType}
					className={className}
				/>
			))
		: null;
});

const Tags = TagsComponent as typeof TagsComponent & { Tag: typeof Tag };

Tags.Tag = Tag;

export default Tags;
