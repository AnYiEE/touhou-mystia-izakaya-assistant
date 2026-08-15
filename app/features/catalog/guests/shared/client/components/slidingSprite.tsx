import { cn } from '@heroui/theme';
import { motion } from 'framer-motion';
import {
	type ReactNode,
	memo,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { CLASSNAME_FOCUS_VISIBLE_OUTLINE } from '@/design/ui/components/constant';
import PressElement from '@/design/ui/components/pressElement';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { TSpriteId, TSpriteTarget } from '@/domain/data/sprites/types';

import { Sprite as SpriteClass } from '@/features/catalog/presentation/SpriteModel';
import Sprite, {
	type ISpriteProps,
} from '@/features/catalog/shared/client/components/Sprite';

interface ISpriteState {
	fallback?: ReactNode;
	index: number;
	isFallback: boolean;
	key: string;
}

const PREVIOUS_SPRITE_ANIMATE = { x: '-100%' } as const;
const PREVIOUS_SPRITE_INITIAL = { x: 0 } as const;
const CURRENT_SPRITE_INITIAL = { x: '100%' } as const;
const SPRITE_SLIDE_TRANSITION = { duration: 0.5, ease: 'easeOut' } as const;
const REDUCED_MOTION_TRANSITION = { duration: 0 } as const;

type IProps<T extends TSpriteTarget = TSpriteTarget> = Omit<
	ISpriteProps<T>,
	'className' | 'index' | 'recordId'
> & {
	className?: string;
	fallback?: ReactNode;
	fallbackKey?: string;
	isFallback?: boolean;
	recordId?: TSpriteId<T>;
};

function SlidingSprite<T extends TSpriteTarget>({
	className,
	fallback,
	fallbackKey = 'fallback',
	height,
	isFallback = false,
	onClick,
	onKeyDown,
	onPress,
	recordId,
	role,
	size,
	style,
	tabIndex,
	target,
	title,
	width,
	...props
}: IProps<T>) {
	const isReducedMotion = useReducedMotion();
	const instance = SpriteClass.getInstance(target);
	const calculatedIndex = useMemo(() => {
		if (isFallback) {
			return 0;
		}
		if (recordId === undefined) {
			throw new TypeError(
				'SlidingSprite requires a recordId unless it is a fallback.'
			);
		}
		return instance.findIndexById(recordId);
	}, [instance, isFallback, recordId]);
	const targetKey = isFallback
		? `${target}:fallback:${fallbackKey}`
		: `${target}:sprite:${calculatedIndex}:${recordId ?? ''}`;
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
	const visibleSpriteStyle = useMemo(
		() => ({ ...style, display: 'block' as const }),
		[style]
	);
	const hiddenSpriteStyle = useMemo(
		() => ({
			...style,
			display: 'block' as const,
			visibility: 'hidden' as const,
		}),
		[style]
	);
	const handleAnimationComplete = useCallback(() => {
		setPreviousSprite(null);
	}, []);

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
				style={visibleSpriteStyle}
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
				style={hiddenSpriteStyle}
				target={target}
				{...spriteSizeProps}
			/>
			{activePreviousSprite && !isReducedMotion && (
				<motion.span
					key={`previous:${activePreviousSprite.key}:${targetKey}`}
					animate={PREVIOUS_SPRITE_ANIMATE}
					initial={PREVIOUS_SPRITE_INITIAL}
					onAnimationComplete={handleAnimationComplete}
					transition={SPRITE_SLIDE_TRANSITION}
					className="pointer-events-none absolute inset-0 block"
				>
					{renderContent(activePreviousSprite)}
				</motion.span>
			)}
			<motion.span
				key={`current:${targetKey}:${activePreviousSprite?.key ?? 'steady'}`}
				animate={PREVIOUS_SPRITE_INITIAL}
				initial={
					activePreviousSprite && !isReducedMotion
						? CURRENT_SPRITE_INITIAL
						: PREVIOUS_SPRITE_INITIAL
				}
				transition={
					isReducedMotion
						? REDUCED_MOTION_TRANSITION
						: SPRITE_SLIDE_TRANSITION
				}
				className="pointer-events-none absolute inset-0 block"
			>
				{renderContent(currentSprite)}
			</motion.span>
		</PressElement>
	);
}

export default memo(SlidingSprite) as typeof SlidingSprite;
