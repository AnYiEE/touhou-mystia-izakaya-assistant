'use client';

import { type ReactNode, memo } from 'react';

import {
	Modal as HeroUIModal,
	ModalBody,
	ModalContent,
	type ModalProps,
} from '@heroui/modal';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

import { ScrollShadow, cn, useReducedMotion } from '@/design/ui/components';

import { globalStore as store } from '@/stores';

interface IProps extends Omit<ModalProps, 'children'> {
	children: ReactNode | ((onClose: () => void) => ReactNode);
	classNames?: ModalProps['classNames'] & { content?: string };
	scrollShadow?: boolean;
	scrollShadowSize?: number;
}

export default memo<IProps>(function Modal({
	children,
	classNames,
	scrollBehavior = 'inside',
	scrollShadow = true,
	scrollShadowSize = 16,
	size = '3xl',
	...props
}) {
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<HeroUIModal
			backdrop={isHighAppearance ? 'blur' : 'opaque'}
			disableAnimation={isReducedMotion}
			scrollBehavior={scrollBehavior}
			size={size}
			classNames={{
				...classNames,
				base: cn(
					isHighAppearance
						? 'bg-blend-mystia'
						: 'bg-background dark:bg-content1',
					classNames?.base
				),
				closeButton: cn(
					'transition-background motion-reduce:transition-none',
					isHighAppearance
						? 'hover:bg-content1 active:bg-content2'
						: 'dark:hover:bg-default-200 dark:active:bg-default',
					classNames?.closeButton
				),
			}}
			{...props}
		>
			<ModalContent className={cn('py-3', classNames?.content)}>
				{(onModalClose) => (
					<ModalBody>
						<ScrollShadow
							isEnabled={scrollShadow}
							size={scrollShadowSize}
						>
							{typeof children === 'function'
								? children(onModalClose)
								: children}
						</ScrollShadow>
					</ModalBody>
				)}
			</ModalContent>
		</HeroUIModal>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as IModalProps };
