import {type MetadataRoute} from 'next';

import {siteConfig} from '@/configs';

const {domain} = siteConfig;

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
	const disallowBots = [
		// cSpell:disable
		'AdIdxBot',
		'AhrefsBot',
		'AmazonBot',
		'anthropic-ai',
		'Applebot-Extended',
		'archive.org_bot',
		'Browsershots',
		'Bytespider',
		'CCBot',
		'ChatGLM',
		'ChatGPT-User',
		'ClaudeBot',
		'Claude-Web',
		'coccocbot',
		'cohere-ai',
		'Diffbot',
		'DOC',
		'DotBot',
		'Download Ninja',
		'EasouSpider',
		'FacebookBot',
		'fast',
		'Fetch',
		'FriendlyCrawler',
		'GPTBot',
		'grub-client',
		'HTTrack',
		'ia_archiver',
		'iaskspider',
		'img2dataset',
		'ImagesiftBot',
		'k2spider',
		'larbin',
		'libwww',
		'linko',
		'MBCrawler',
		'Microsoft.URL.Control',
		'MJ12bot',
		'MSIECrawler',
		'MSNot-media',
		'NPBot',
		'Offline Explorer',
		'omgili',
		'PerplexityBot',
		'Semrush',
		'sitecheck.internetseer.com',
		'SiteSnagger',
		'SkyworkSpider',
		'Teleport',
		'Teoma',
		'Timpibot',
		'UbiCrawler',
		'WebCopier',
		'WebReaper',
		'WebStripper',
		'WebZIP',
		'wget',
		'Xenu',
		'YandexBot',
		'YisouSpider',
		'YouBot',
		'Zao',
		'Zealbot',
		'ZyBORG',
		// cSpell:enable
	];

	return {
		rules: [
			{
				disallow: '/preferences',
				userAgent: '*',
			},
			{
				disallow: '/',
				userAgent: disallowBots,
			},
		],
		sitemap: `https://${domain}/sitemap.xml`,
	};
}
