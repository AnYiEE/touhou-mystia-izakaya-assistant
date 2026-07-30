'use client';

import { faLink, faShare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo, useCallback, useMemo } from 'react';

import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import SiteInfo from '@/design/ui/components/siteInfo';
import Snippet from '@/design/ui/components/snippet';
import Tooltip from '@/design/ui/components/tooltip';

import type { TItemName } from '@/domain/data/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useParams } from '@/features/appShell/client/navigation/useParams';
import {
	createItemShareData,
	createItemShareUrl,
} from '@/features/itemSharing/shareUrl';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

interface IItemShareButtonProps {
	name: TItemName;
}

export const ItemShareButton = memo<IItemShareButtonProps>(
	function ItemShareButton({ name }) {
		const { params } = useParams();

		const generatedUrl = useMemo(
			() =>
				createItemShareUrl({
					name,
					params,
					pathname: location.pathname,
				}),
			[name, params]
		);

		const shareObject = useMemo<ShareData>(
			() => createItemShareData(name, generatedUrl),
			[generatedUrl, name]
		);

		const isCanShare = useMemo(() => {
			try {
				// For checking if the browser supports the share API.
				return navigator.canShare(shareObject);
			} catch {
				return false;
			}
		}, [shareObject]);

		const handlePress = useCallback(() => {
			if (isCanShare) {
				navigator.share(shareObject).catch(() => {});
			}
			trackEvent(trackEvent.category.click, 'Share Button', name);
		}, [isCanShare, name, shareObject]);

		const label = '点击：分享到当前选中项的链接';

		return (
			<>
				<SiteInfo
					baseUrl={PUBLIC_RUNTIME_CONFIG.baseURL}
					fontSize={7}
					className="absolute bottom-1 right-6 text-right [text-shadow:0px_0.5px_0.75px_rgba(0,0,0,0.15)]"
				/>
				<Popover showArrow>
					<Tooltip
						showArrow
						content={label}
						offset={5}
						placement="left"
						size="sm"
					>
						<div className="absolute bottom-1 right-1 z-20 flex">
							<PopoverTrigger>
								<FontAwesomeIconButton
									icon={faShare}
									variant="light"
									onPress={handlePress}
									aria-label={label}
									className="h-4 w-4 min-w-0 transform-gpu text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
								/>
							</PopoverTrigger>
						</div>
					</Tooltip>
					<PopoverContent>
						<p className="mr-4 cursor-default select-none self-end text-right text-tiny text-default-500">
							点击以复制到当前选中项的链接↓
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
							{generatedUrl}
						</Snippet>
					</PopoverContent>
				</Popover>
			</>
		);
	}
);
