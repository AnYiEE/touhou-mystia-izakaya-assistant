import {
	faArrowUpRightFromSquare,
	faLink,
	faShare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import Snippet from '@/design/ui/components/snippet';

import { renderCatalogMatchedField } from '@/features/catalog/globalSearch/client/renderCatalogMatchedField';
import { getGlobalSearchItemShareUrl } from '@/features/globalSearch/client/navigationActions';
import type {
	IGlobalSearchIndexItem,
	IGlobalSearchMatchedField,
	IGlobalSearchResult,
} from '@/features/globalSearch/contracts';

import { SearchItemVisual } from './SearchItemVisual';
import { SpotlightPreviewMotion } from './SpotlightMotion';

export function SearchPreview({
	onOpenItem,
	onOpenNewWindow,
	onShareItem,
	selectedResult,
}: {
	onOpenItem: (
		item: IGlobalSearchIndexItem,
		match?: IGlobalSearchMatchedField
	) => void;
	onOpenNewWindow: (
		item: IGlobalSearchIndexItem,
		match?: IGlobalSearchMatchedField
	) => void;
	onShareItem: (item: IGlobalSearchIndexItem) => void;
	selectedResult: IGlobalSearchResult | null;
}) {
	if (selectedResult === null) {
		return (
			<SpotlightPreviewMotion
				motionKey="empty"
				className="flex h-full min-h-48 items-start justify-center px-4 pt-24 text-center"
			>
				<p className="max-w-56 text-small leading-5 text-foreground-400">
					选择一个结果查看摘要
				</p>
			</SpotlightPreviewMotion>
		);
	}

	const { item, matches } = selectedResult;
	const [selectedMatch] = matches;
	const shareUrl = getGlobalSearchItemShareUrl(item);
	const previewMatches = matches.filter(
		({ field }) =>
			field.fieldType !== 'description' || item.description.length === 0
	);

	return (
		<div className="flex h-full min-h-0 flex-col gap-3">
			<div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1.5 scrollbar-hide">
				<SpotlightPreviewMotion
					motionKey={item.id}
					className="min-w-0 space-y-3 overflow-hidden pb-0.5"
				>
					<div className="flex min-w-0 items-start gap-3 rounded-small border border-default-200/40 bg-default/20 p-2.5">
						<SearchItemVisual item={item} size="md" />
						<div className="min-w-0 flex-1 overflow-hidden">
							<p className="text-tiny font-medium text-foreground-500">
								{item.sectionLabel}
							</p>
							<h2 className="truncate text-lg font-semibold leading-tight">
								{item.name}
							</h2>
							{item.description.length > 0 && (
								<p className="mt-1 line-clamp-3 max-w-full break-words text-small leading-5 text-foreground-600">
									{item.description}
								</p>
							)}
						</div>
					</div>
					{previewMatches.length > 0 && (
						<div className="space-y-1">
							{previewMatches.slice(0, 4).map((match, index) => (
								<div
									key={`${match.field.fieldType}-${index}`}
									className="flex min-h-8 min-w-0 max-w-full flex-wrap items-center overflow-hidden rounded-small border border-default-200/40 bg-default/25 px-2 py-0.5 text-small leading-5"
								>
									<span className="shrink-0 font-medium">
										{match.field.label}：
									</span>
									<span className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
										{renderCatalogMatchedField(
											item,
											match
										) ?? (
											<span className="min-w-0 break-words">
												{match.snippet}
											</span>
										)}
									</span>
								</div>
							))}
						</div>
					)}
				</SpotlightPreviewMotion>
			</div>
			<div className="flex min-w-0 shrink-0 flex-wrap gap-2 border-t border-default-200/60 pt-3">
				<Button
					color="primary"
					size="sm"
					className="h-9 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
					onPress={() => {
						onOpenItem(item, selectedMatch);
					}}
				>
					{item.section === 'preferences'
						? item.navigationAction?.type === 'open-customer-plans'
							? '打开营业预设'
							: '打开设置'
						: '查看详情'}
				</Button>
				{item.section !== 'preferences' && (
					<>
						<Popover showArrow placement="top">
							<PopoverTrigger>
								<Button
									size="sm"
									variant="flat"
									className="h-9 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
									startContent={
										<FontAwesomeIcon icon={faShare} />
									}
									onPress={() => {
										onShareItem(item);
									}}
								>
									分享
								</Button>
							</PopoverTrigger>
							<PopoverContent>
								<p className="mr-4 cursor-default select-none self-end text-right text-tiny text-default-500">
									点击以复制当前选中项的链接↓
								</p>
								<Snippet
									disableTooltip
									size="sm"
									symbol={
										<FontAwesomeIcon
											icon={faLink}
											className="mr-1 !align-middle text-default-700"
										/>
									}
									classNames={{
										pre: 'flex max-w-screen-p-60 items-center whitespace-normal break-all',
									}}
								>
									{shareUrl}
								</Snippet>
							</PopoverContent>
						</Popover>
						<Button
							size="sm"
							variant="flat"
							className="h-9 min-w-0 flex-1 px-2 sm:flex-none sm:px-3"
							startContent={
								<FontAwesomeIcon
									icon={faArrowUpRightFromSquare}
								/>
							}
							onPress={() => {
								onOpenNewWindow(item, selectedMatch);
							}}
						>
							新标签页打开
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
