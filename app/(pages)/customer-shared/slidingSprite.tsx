import {
	type ReactNode,
	memo,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { motion } from 'framer-motion';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE, cn } from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import PressElement from '@/components/pressElement';
import Sprite, { type ISpriteProps } from '@/components/sprite';

import { Sprite as SpriteClass } from '@/utils';

interface ISpriteState {
	fallback?: ReactNode;
	isFallback: boolean;
	index: number;
	key: string;
}

interface IProps extends Omit<ISpriteProps, 'className'> {
	className?: string;
	fallback?: ReactNode;
	fallbackKey?: string;
	isFallback?: boolean;
}

export default memo<IProps>(function SlidingSprite({
	className,
	fallback,
	fallbackKey = 'fallback',
	height,
	index,
	isFallback = false,
	name,
	onClick,
	onKeyDown,
	onPress,
	role,
	size,
	style,
	tabIndex,
	target,
	title,
	width,
	...props
}) {
	const isReducedMotion = useReducedMotion();
	const instance = SpriteClass.getInstance(target);
	const calculatedIndex = useMemo(() => {
		if (index !== undefined) {
			return index;
		}
		if (name === undefined) {
			return 0;
		}
		return instance.findIndexByName(name);
	}, [index, instance, name]);
	const targetKey = isFallback
		? `${target}:fallback:${fallbackKey}`
		: `${target}:sprite:${calculatedIndex}:${name ?? index ?? ''}`;
	const currentSprite = useMemo<ISpriteState>(
		() => ({
			fallback,
			index: calculatedIndex,
			isFallback,
			key: targetKey,
		}),
		[calculatedIndex, fallback, isFallback, targetKey]
	);
	const currentSpriteRef = useRef(currentSprite);
	const isTargetChanged = currentSpriteRef.current.key !== targetKey;
	const [previousSprite, setPreviousSprite] = useState<ISpriteState | null>(
		null
	);
	const activePreviousSprite = isTargetChanged
		? currentSpriteRef.current
		: previousSprite;
	const isAsButton = role === 'button';
	const spriteSizeProps = useMemo(
		() => ({
			...(height === undefined ? {} : { height }),
			...(size === undefined ? {} : { size }),
			...(width === undefined ? {} : { width }),
		}),
		[height, size, width]
	);

	useLayoutEffect(() => {
		if (currentSpriteRef.current.key !== targetKey) {
			setPreviousSprite(currentSpriteRef.current);
		}
		currentSpriteRef.current = currentSprite;
	}, [currentSprite, targetKey]);

	const renderContent = (state: ISpriteState) =>
		state.isFallback ? (
			state.fallback
		) : (
			<Sprite
				aria-hidden
				index={state.index}
				style={{ ...style, display: 'block' }}
				target={target}
				{...spriteSizeProps}
			/>
		);

	return (
		<PressElement
			onClick={onClick}
			onKeyDown={onKeyDown}
			onPress={onPress}
			role={role ?? 'img'}
			tabIndex={tabIndex ?? (isAsButton ? 0 : undefined)}
			title={
				title ??
				(isFallback
					? undefined
					: instance.findNameByIndex(calculatedIndex))
			}
			className={cn(
				'relative inline-block overflow-hidden text-[0px] leading-none',
				{
					[CLASSNAME_FOCUS_VISIBLE_OUTLINE]: isAsButton,
					'cursor-pointer': isAsButton,
				},
				className
			)}
			{...props}
		>
			<Sprite
				aria-hidden
				index={calculatedIndex}
				style={{ ...style, display: 'block', visibility: 'hidden' }}
				target={target}
				{...spriteSizeProps}
			/>
			{activePreviousSprite && !isReducedMotion && (
				<motion.span
					key={`previous:${activePreviousSprite.key}:${targetKey}`}
					animate={{ x: '-100%' }}
					initial={{ x: 0 }}
					onAnimationComplete={() => {
						setPreviousSprite(null);
					}}
					transition={{ duration: 0.5, ease: 'easeOut' }}
					className="pointer-events-none absolute inset-0 block"
				>
					{renderContent(activePreviousSprite)}
				</motion.span>
			)}
			<motion.span
				key={`current:${targetKey}:${activePreviousSprite?.key ?? 'steady'}`}
				animate={{ x: 0 }}
				initial={
					activePreviousSprite && !isReducedMotion
						? { x: '100%' }
						: { x: 0 }
				}
				transition={
					isReducedMotion
						? { duration: 0 }
						: { duration: 0.5, ease: 'easeOut' }
				}
				className="pointer-events-none absolute inset-0 block"
			>
				{renderContent(currentSprite)}
			</motion.span>
		</PressElement>
	);
});
