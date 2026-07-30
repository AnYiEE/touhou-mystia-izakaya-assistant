import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import Button from '@/design/ui/components/button';

import {
	type IConflictDifferenceResult,
	formatFriendlyConflictValue,
} from './presentation';

interface IConflictVersionCardProps {
	buttonLabel: string;
	description: string;
	differences: IConflictDifferenceResult;
	icon: FontAwesomeIconProps['icon'];
	isDisabled: boolean;
	isHighAppearance: boolean;
	isLoading: boolean;
	title: string;
	valueKey: 'cloud' | 'local';
	onSelect: () => void;
}

const ConflictVersionCard = memo<IConflictVersionCardProps>(
	function ConflictVersionCard({
		buttonLabel,
		description,
		differences,
		icon,
		isDisabled,
		isHighAppearance,
		isLoading,
		onSelect,
		title,
		valueKey,
	}) {
		return (
			<div
				className={cn(
					'flex min-w-0 flex-col gap-4 rounded-medium border border-default-200/70 p-4 shadow-small',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-content1 dark:bg-content1/70'
				)}
			>
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-600 dark:text-primary">
						<FontAwesomeIcon
							icon={icon}
							className="mx-auto block !h-4 !w-4"
						/>
					</div>
					<div className="min-w-0">
						<h3 className="font-medium text-foreground-700">
							{title}
						</h3>
						<p className="mt-1 text-small leading-5 text-foreground-500">
							{description}
						</p>
					</div>
				</div>

				<div
					className={cn(
						'flex-1 divide-y divide-default-200/70 overflow-hidden rounded-small border border-default-200/70',
						isHighAppearance
							? 'bg-background/35 dark:bg-default-50/5'
							: 'bg-default-50/60 dark:bg-default-50/10'
					)}
				>
					{differences.items.length === 0 ? (
						<p className="px-3 py-4 text-small text-foreground-500">
							未检测到可展示的差异
						</p>
					) : (
						differences.items.map((difference, index) => (
							<div
								key={`${difference.label}-${index}`}
								className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,auto)] items-center gap-4 px-3 py-2.5 text-small"
							>
								<span className="min-w-0 text-foreground-500">
									{difference.label}
								</span>
								<span className="break-words text-right font-medium text-foreground-700">
									{formatFriendlyConflictValue(
										difference[valueKey],
										difference.path
									)}
								</span>
							</div>
						))
					)}
					{differences.hasMore && (
						<p className="px-3 py-2 text-tiny text-foreground-500">
							还有更多差异，可在技术详情中查看
						</p>
					)}
				</div>

				<Button
					fullWidth
					color="primary"
					isDisabled={isDisabled}
					isLoading={isLoading}
					variant="flat"
					onPress={onSelect}
				>
					{buttonLabel}
				</Button>
			</div>
		);
	}
);

export default ConflictVersionCard;
