'use client';

import { cn } from '@heroui/theme';
import { type SyntheticEvent, memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

interface IAdminPaginationProps {
	currentPage: number;
	isLoading: boolean;
	onNextPage: () => void;
	onPageInputChange: (value: string) => void;
	onPageJumpSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
	onPreviousPage: () => void;
	pageInput: string;
	pageSize?: number | undefined;
	totalCount?: number | undefined;
	totalLabel: string;
	totalPages: number;
}

export const AdminPagination = memo<IAdminPaginationProps>(
	function AdminPagination({
		currentPage,
		isLoading,
		onNextPage,
		onPageInputChange,
		onPageJumpSubmit,
		onPreviousPage,
		pageInput,
		pageSize,
		totalCount,
		totalLabel,
		totalPages,
	}) {
		const { isHighAppearance } = useDesignPreferences();
		const safeTotalPages = Math.max(1, totalPages);

		return (
			<div
				className={cn(
					'flex flex-wrap items-center justify-between gap-3 rounded-small border border-default-200/80 px-3 py-2 text-small text-foreground-500',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/50 dark:bg-default-100/10'
				)}
			>
				<span>
					第{currentPage} / {safeTotalPages}页
					{pageSize !== undefined && ` · 每页${pageSize}`}
					{totalCount !== undefined &&
						` · 共${totalCount}${totalLabel}`}
				</span>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						isDisabled={currentPage <= 1 || isLoading}
						size="sm"
						variant="flat"
						onPress={onPreviousPage}
					>
						上一页
					</Button>
					<Button
						isDisabled={isLoading || currentPage >= safeTotalPages}
						size="sm"
						variant="flat"
						onPress={onNextPage}
					>
						下一页
					</Button>
					<form
						className="flex items-center gap-2"
						onSubmit={onPageJumpSubmit}
					>
						<Input
							aria-label="跳转页码"
							className="w-20"
							classNames={{
								input: 'text-center',
								inputWrapper: 'h-8 min-h-8',
							}}
							inputMode="numeric"
							placeholder="页码"
							size="sm"
							value={pageInput}
							onValueChange={onPageInputChange}
						/>
						<Button
							isDisabled={isLoading || pageInput.length === 0}
							size="sm"
							type="submit"
							variant="light"
						>
							跳转
						</Button>
					</form>
				</div>
			</div>
		);
	}
);
