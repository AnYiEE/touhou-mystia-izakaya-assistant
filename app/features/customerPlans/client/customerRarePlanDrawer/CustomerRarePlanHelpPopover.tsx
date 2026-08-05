import { faCircleQuestion, faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '@/design/ui/components/button';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Popover, {
	type IPopoverProps,
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

export default function CustomerRarePlanHelpPopover({
	isOpen,
	onOpenChange,
	onOpenHiddenItemsSettings,
	onOpenRatingSettings,
	portalContainerProps,
	shouldCloseOnInteractOutside,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onOpenHiddenItemsSettings: () => void;
	onOpenRatingSettings: () => void;
	portalContainerProps: Pick<IPopoverProps, 'portalContainer'>;
	shouldCloseOnInteractOutside: () => boolean;
}) {
	return (
		<Popover
			shouldBlockScroll
			showArrow
			isOpen={isOpen}
			shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
			onOpenChange={onOpenChange}
			{...portalContainerProps}
		>
			<PopoverTrigger>
				<FontAwesomeIconButton
					icon={faCircleQuestion}
					variant="light"
					aria-label="查看营业预设说明"
				/>
			</PopoverTrigger>
			<PopoverContent>
				<div className="max-w-80 space-y-2 p-1 text-tiny leading-5 text-foreground-500">
					<p className="font-medium text-foreground-700">
						每晚营业前，把本轮可能出现的稀客放进预设，开店时集中查看。
					</p>
					<div className="space-y-2">
						<div>
							<p className="font-medium text-foreground-600">
								选择稀客
							</p>
							<p>按营业地区加入出没稀客，也可以手动指定。</p>
						</div>
						<div>
							<p className="font-medium text-foreground-600">
								套餐来源
							</p>
							<div className="mt-1 space-y-1 rounded-small border border-default-200/60 bg-default-50/30 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]">
								<p>
									<span className="font-medium text-foreground-600">
										已保存套餐：
									</span>
									显示您为这些稀客手动保存的搭配。
								</p>
								<p>
									<span className="font-medium text-foreground-600">
										自动推荐：
									</span>
									按稀客的料理和酒水需求生成参考搭配。
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-small border border-default-200/60 bg-default-50/30 px-2 py-1.5 text-foreground-500 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]">
						<p className="font-medium text-foreground-600">
							设置会影响这里看到的内容
						</p>
						<p>
							将游戏内容标为未拥有，或隐藏料理、酒水、食材后，用到它们的已保存套餐会被隐藏；自动推荐也不会拿它们来搭配。
						</p>
						<p>
							流行趋势和明星店效果会影响评级，请按当前游戏状态调整。
						</p>
						<div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
							<Button
								fullWidth
								size="sm"
								variant="flat"
								startContent={<FontAwesomeIcon icon={faGear} />}
								onClick={onOpenHiddenItemsSettings}
							>
								隐藏项目
							</Button>
							<Button
								fullWidth
								size="sm"
								variant="flat"
								startContent={<FontAwesomeIcon icon={faGear} />}
								onClick={onOpenRatingSettings}
							>
								流行趋势/明星店
							</Button>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
