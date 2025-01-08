import {type ComponentRef, type HTMLAttributes, forwardRef, memo} from 'react';
import {clamp} from 'lodash';

import {type IRippleItem, type TUseRippleReturn} from './useRipple';

import {AnimatePresence, type HTMLMotionProps, LazyMotion, type MotionStyle, domAnimation, m} from 'motion/react';
import {cn} from '@/design/ui/components';

interface IProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'style'> {
	ripples: IRippleItem[];
	onClear: TUseRippleReturn['onClear'];
	color?: MotionStyle['backgroundColor'];
	motionProps?: HTMLMotionProps<'span'>;
	style?: MotionStyle;
}

export default memo(
	forwardRef<ComponentRef<'span'>, IProps>(function Ripple(
		{className, color = 'currentColor', motionProps, onClear, ripples, style},
		ref
	) {
		return (
			<>
				{ripples.map(({key, size, x, y}) => {
					const duration = clamp(0.01 * size, 0.2, size > 100 ? 0.8 : 0.5);

					return (
						<LazyMotion key={key} features={domAnimation}>
							<AnimatePresence mode="popLayout">
								<m.span
									animate={{
										opacity: 0,
										transform: 'scale(2)',
									}}
									className={cn('pointer-events-none absolute origin-center rounded-full', className)}
									exit={{
										opacity: 0,
									}}
									initial={{
										opacity: 0.3,
										transform: 'scale(0)',
									}}
									style={{
										backgroundColor: color,
										height: `${size}px`,
										left: x,
										top: y,
										width: `${size}px`,
										...style,
									}}
									transition={{
										duration,
									}}
									onAnimationComplete={() => {
										onClear(key);
									}}
									ref={ref}
									{...motionProps}
								/>
							</AnimatePresence>
						</LazyMotion>
					);
				})}
			</>
		);
	})
);

export type {IProps as IRippleProps};
