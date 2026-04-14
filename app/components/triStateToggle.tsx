import { memo, useCallback } from 'react';

import { Button, cn } from '@/design/ui/components';

type TItemState = 'all' | 'disabled' | 'rare';

const STATE_CONFIG = {
	all: { color: 'success', icon: '●', label: '全用' },
	disabled: { color: 'default', icon: '○', label: '禁用' },
	rare: { color: 'warning', icon: '◐', label: '稀客' },
} as const;

interface ITriStateToggleProps {
	'aria-label': string;
	className?: string | undefined;
	isDisabled?: boolean | undefined;
	onPress: () => void;
	state: TItemState;
	title?: string | undefined;
}

const TriStateToggle = memo<ITriStateToggleProps>(function TriStateToggle({
	'aria-label': ariaLabel,
	className,
	isDisabled,
	onPress,
	state,
	title,
}) {
	const config = STATE_CONFIG[state];

	const handlePress = useCallback(() => {
		onPress();
	}, [onPress]);

	return (
		<Button
			isDisabled={isDisabled}
			size="sm"
			variant="flat"
			color={config.color}
			onPress={handlePress}
			aria-label={ariaLabel}
			title={title}
			className={cn('min-w-12 px-2 text-xs', className)}
		>
			{config.icon} {config.label}
		</Button>
	);
});

export default TriStateToggle;
export type { TItemState };

export function getItemState(
	name: string,
	hiddenItems: ReadonlySet<string>,
	rareOnlyItems: ReadonlySet<string>
): TItemState {
	if (hiddenItems.has(name)) {
		return 'disabled';
	}
	if (rareOnlyItems.has(name)) {
		return 'rare';
	}
	return 'all';
}

export function cycleItemState(current: TItemState): TItemState {
	if (current === 'all') {
		return 'rare';
	}
	if (current === 'rare') {
		return 'disabled';
	}
	return 'all';
}
