import { type Metadata } from 'next';

export const metadata: Metadata = {
	title: 'MetaMystia - 东方夜雀食堂联机Mod',

	description:
		'MetaMystia是为游戏《东方夜雀食堂》制作的非官方Mod，提供多人联机、ResourceEx内容扩展（新稀客、料理、食材和酒水）和皮肤系统，支持一键安装。',
	keywords: [
		'MetaMystia',
		'夜雀食堂联机',
		'东方夜雀食堂联机',
		'夜雀食堂Mod',
		'东方夜雀食堂Mod',
		'夜雀食堂多人',
		'ResourceEx',
	],
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
