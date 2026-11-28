'use client';

import { cn } from '@heroui/theme';
import { type ReactNode, type RefObject, memo, useRef } from 'react';

import Popover, {
	type IPopoverProps,
	PopoverContent,
} from '@/design/ui/components/popover';

import LoginGatePrompt from '@/features/loginGate/client/components/LoginGatePrompt';
import { type TLoginGateModuleKey } from '@/features/loginGate/contracts';

interface IProps extends Pick<IPopoverProps, 'placement'> {
	/** The host's trigger subtree, e.g. the save button with its tooltip. */
	children: ReactNode;
	/** Anchor wrapper; `inline-flex` keeps a flex item's intrinsic size. */
	className?: string;
	isOpen: boolean;
	moduleKey: TLoginGateModuleKey;
	onOpenChange: (isOpen: boolean) => void;
}

/**
 * Anchors the prompt to an action the gate has stopped, such as saving a
 * meal. The trigger keeps its own press handling; the gate logic opens this.
 */
export default memo<IProps>(function LoginGateActionPopover({
	children,
	className,
	isOpen,
	moduleKey,
	onOpenChange,
	placement = 'top',
}) {
	const anchorRef = useRef<HTMLSpanElement>(null);

	return (
		<Popover
			showArrow
			isOpen={isOpen}
			placement={placement}
			// HeroUI still types `triggerRef` with the pre-React 19 non-null
			// `RefObject`; it reads `current` only after the anchor mounts.
			triggerRef={anchorRef as RefObject<HTMLElement>}
			onOpenChange={onOpenChange}
		>
			<span ref={anchorRef} className={cn('inline-flex', className)}>
				{children}
			</span>
			<PopoverContent>
				<div className="w-72 max-w-[calc(100vw-2rem)] p-2">
					<LoginGatePrompt shouldIgnoreMode moduleKey={moduleKey} />
				</div>
			</PopoverContent>
		</Popover>
	);
});
