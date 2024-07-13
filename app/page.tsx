import {memo} from 'react';

import {Image} from '@nextui-org/react';

import Loading from '@/loading';

import {siteConfig} from '@/configs';

const {shortName} = siteConfig;

export default memo(function Home() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 md:gap-8 lg:flex-row lg:gap-16">
			<Loading
				content={
					<>
						分享经验、交流心得
						<br />
						提出建议、反馈问题
						<br />
						皆可扫描二维码加群
					</>
				}
				title={`欢迎使用${shortName}`}
				className="h-max w-max"
			/>
			<Image
				isBlurred
				alt="小红书加群二维码"
				draggable={false}
				src="/assets/Xiaohongshu.png"
				className="h-96 select-none dark:brightness-75 dark:contrast-125"
			/>
		</div>
	);
});
