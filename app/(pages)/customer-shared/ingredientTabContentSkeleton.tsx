import { type PropsWithChildren, type ReactNode, memo } from 'react';
import { debounce } from 'lodash';

import { Button, ScrollShadow, cn } from '@/design/ui/components';

import type { IIngredientsTabStyle } from '@/(pages)/customer-shared/types';
import { checkA11yConfirmKey } from '@/utilities';

interface IProps {
	afterMainGrid?: ReactNode;
	ingredientTabStyle: IIngredientsTabStyle;
	onToggle: () => void;
}

export default memo<PropsWithChildren<IProps>>(
	function IngredientTabContentSkeleton({
		afterMainGrid,
		children,
		ingredientTabStyle,
		onToggle,
	}) {
		return (
			<>
				<ScrollShadow
					className={cn(
						'px-2 transition-all motion-reduce:transition-none xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
						ingredientTabStyle.classNames.content
					)}
				>
					<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
						{children}
					</div>
					{afterMainGrid}
				</ScrollShadow>
				<div className="flex justify-center xl:hidden">
					<Button
						isIconOnly
						size="sm"
						variant="flat"
						onClick={onToggle}
						onKeyDown={debounce(checkA11yConfirmKey(onToggle))}
						aria-label={ingredientTabStyle.ariaLabel}
						className="h-4 w-4/5 text-default-400"
					>
						{ingredientTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	}
);
