import { memo, useCallback, useMemo, useState } from 'react';

import { Select, SelectItem } from '@heroui/select';

import { cn } from '@/design/ui/components';

import Placeholder from '@/components/placeholder';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import type { TPlace } from '@/data';
import { customerNormalStore as customerStore } from '@/stores';
import type { ICoverageResult } from '@/utils';

interface ICoverageCardProps {
	result: ICoverageResult;
}

const CoverageCard = memo<ICoverageCardProps>(function CoverageCard({
	result,
}) {
	const {
		acquisitionWeight,
		customerScores,
		goodCount,
		recipeName,
		totalCoverage,
	} = result;
	const [isExpanded, setIsExpanded] = useState(false);

	const sortedScores = useMemo(
		() => [...customerScores].sort((a, b) => b.score - a.score),
		[customerScores]
	);

	return (
		<div className="rounded-medium bg-content1/50">
			<button
				type="button"
				className={cn(
					'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
					'hover:bg-content2/50',
					isExpanded && 'border-b border-divider'
				)}
				onClick={() => {
					setIsExpanded((prev) => !prev);
				}}
			>
				<Sprite target="recipe" name={recipeName} size={2} />
				<div className="flex min-w-0 flex-1 flex-col">
					<p className="truncate text-small font-medium">
						{recipeName}
					</p>
					<div className="flex gap-3 text-tiny text-default-500">
						<span>覆盖度：{totalCoverage}</span>
						<span>满足≥3标签：{goodCount}人</span>
						<span>获取：{Math.round(acquisitionWeight)}</span>
					</div>
				</div>
				<span
					className={cn(
						'text-tiny text-default-400 transition-transform',
						isExpanded && 'rotate-90'
					)}
				>
					▶
				</span>
			</button>
			{isExpanded && (
				<div className="flex flex-col gap-1 px-3 py-2 text-tiny">
					{sortedScores.map((cs) => (
						<div key={cs.name} className="flex items-center gap-2">
							<span
								className={cn(
									'w-16 shrink-0 truncate',
									cs.score >= 3
										? 'text-success'
										: 'text-default-500'
								)}
							>
								{cs.name}
							</span>
							<span className="w-6 shrink-0 text-center">
								{cs.score}
							</span>
							{cs.matchedTags.length > 0 && (
								<Tags
									tags={cs.matchedTags}
									tagType="positive"
								/>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
});

export default function CoverageTabContent() {
	const availableCustomerPlaces = customerStore.availableCustomerPlaces.use();
	const selectedPlace = customerStore.shared.coverage.selectedPlace.use();
	const results = customerStore.shared.coverage.results.use();

	const selectedKeys = useMemo(
		() =>
			selectedPlace === null
				? new Set<string>()
				: new Set([selectedPlace]),
		[selectedPlace]
	);

	const handleSelectionChange = useCallback(
		(keys: 'all' | Set<React.Key>) => {
			if (keys === 'all' || keys.size === 0) {
				customerStore.onCoveragePlaceChange(null);
				return;
			}
			const place = [...keys][0] as TPlace;
			customerStore.onCoveragePlaceChange(place);
		},
		[]
	);

	return (
		<div className="flex flex-col gap-2 px-2">
			<Select
				label="选择地区"
				size="sm"
				selectedKeys={selectedKeys}
				onSelectionChange={handleSelectionChange}
				classNames={{ trigger: 'min-h-10' }}
			>
				{availableCustomerPlaces.map(({ value }) => (
					<SelectItem key={value}>{value}</SelectItem>
				))}
			</Select>
			{selectedPlace === null ? (
				<Placeholder className="py-8">
					<p>请选择地区以查看覆盖率推荐</p>
				</Placeholder>
			) : results.length === 0 ? (
				<Placeholder className="py-8">
					<p>无可用料理</p>
				</Placeholder>
			) : (
				<div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
					{results.map((result) => (
						<CoverageCard key={result.recipeName} result={result} />
					))}
				</div>
			)}
		</div>
	);
}
