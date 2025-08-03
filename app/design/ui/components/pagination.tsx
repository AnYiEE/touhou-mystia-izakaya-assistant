'use client';

import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import {
	Pagination as HeroUIPagination,
	type PaginationProps,
} from '@heroui/pagination';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

interface IProps extends PaginationProps {}

export default memo<IProps>(function Pagination({
	disableAnimation,
	...props
}) {
	const isReducedMotion = useReducedMotion();

	return (
		<HeroUIPagination
			disableAnimation={disableAnimation ?? isReducedMotion}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'nav', IProps>;

export type { IProps as IPaginationProps };
