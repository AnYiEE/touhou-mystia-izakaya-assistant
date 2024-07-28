import {memo} from 'react';

import {Button, Divider, Image, Link, Tooltip} from '@nextui-org/react';
import {faQq} from '@fortawesome/free-brands-svg-icons';

import Loading from '@/loading';
import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import Xiaohongshu from '@/components/xiaohongshu';

import {siteConfig} from '@/configs';

const {shortName} = siteConfig;

export default memo(function Home() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
			<div className="flex flex-col items-center">
				<Loading content={`欢迎使用${shortName}`} className="h-max w-max" />
				<p className="hidden select-none flex-wrap items-center text-xs text-foreground-500 md:flex">
					点击顶部的按钮以使用各项功能
				</p>
				<p className="flex select-none flex-wrap items-center text-xs text-foreground-500 md:hidden">
					点击右上角的
					<span className="mx-1 block h-4 rounded bg-default-100" role="img" aria-label="菜单按钮">
						<span className="flex h-full flex-col justify-center p-1 before:h-px before:w-4 before:-translate-y-1 before:bg-current after:h-px after:w-4 after:translate-y-1 after:bg-current"></span>
					</span>
					以使用各项功能
				</p>
			</div>
			<Divider className="w-12 md:hidden" />
			<Divider orientation="vertical" className="hidden h-12 md:block" />
			<div className="flex flex-wrap items-end text-sm leading-none">
				<p className="md:hidden">官方群：</p>
				<div className="flex gap-2 md:gap-4">
					<Tooltip
						showArrow
						content={
							<div className="flex select-none flex-col items-center">
								<Image
									isBlurred
									alt="QQ加群二维码"
									draggable={false}
									src="/assets/QQ.png"
									className="h-32 dark:invert"
								/>
								<p className="text-xs">
									分享经验、交流心得
									<br />
									提出建议、反馈问题
								</p>
							</div>
						}
						classNames={{
							content: 'px-1',
						}}
					>
						<FontAwesomeIconLink
							isExternal
							icon={faQq}
							href="https://qm.qq.com/q/Zham0MdxyA"
							title="点击加入QQ群"
							className="text-xl text-qq-blue"
						/>
					</Tooltip>
					<Tooltip
						showArrow
						content={
							<div className="flex select-none flex-col items-center">
								<Image
									isBlurred
									alt="小红书加群二维码"
									draggable={false}
									src="/assets/Xiaohongshu.png"
									className="h-32 dark:invert"
								/>
								<p className="text-xs">
									分享经验、交流心得
									<br />
									提出建议、反馈问题
								</p>
							</div>
						}
						classNames={{
							content: 'px-1',
						}}
					>
						<Button
							as={Link}
							isExternal
							isIconOnly
							href="https://www.xiaohongshu.com/sns/invitation/group-chat?groupId=136956731996869234&token=xMbzu2IneK_mgPAGyJxxpYKyeP-zm1PsHZlLjIcS1uXycTLrNNVeaQoPbTJuXF0pMpFI1jYfuoDcRJQ1JhHwwPU3mAO9sg7JQchjlQGp6bs"
							role="link"
							title="点击加入小红书群"
							className="h-5"
						>
							<Xiaohongshu />
						</Button>
					</Tooltip>
				</div>
			</div>
		</div>
	);
});
