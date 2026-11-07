import { type MetadataRoute } from 'next';

import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';

const { baseURL } = PUBLIC_RUNTIME_CONFIG;

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
	const disallowBots = [
		// cSpell:disable
		'AhrefsBot',
		'Ai2Bot',
		'Ai2Bot-Dolma',
		'anthropic-ai',
		'Applebot-Extended',
		'archive.org_bot',
		'Barkrowler',
		'BLEXBot',
		'Bytespider',
		'CCBot',
		'ChatGLM',
		'Claude-Web',
		'ClaudeBot',
		'cohere-ai',
		'cohere-training-data-crawler',
		'DataForSeoBot',
		'Diffbot',
		'DotBot',
		'EasouSpider',
		'FriendlyCrawler',
		'Google-Extended',
		'GPTBot',
		'ia_archiver',
		'ia_archiver-web.archive.org',
		'iaskspider',
		'img2dataset',
		'MBCrawler',
		'MegaIndex',
		'meta-externalagent',
		'MJ12bot',
		'MSNot-media',
		'omgili',
		'Screaming Frog SEO Spider',
		'Semrush',
		'SerpstatBot',
		'SiteAuditBot',
		'SkyworkSpider',
		'SMTBot',
		'special_archiver',
		'Timpibot',
		'YisouSpider',
		'Zao',
		// cSpell:enable
	];

	return {
		rules: [
			{ disallow: '/admin', userAgent: '*' },
			{ disallow: '/api', userAgent: '*' },
			{ disallow: '/preferences', userAgent: '*' },
			{ disallow: '/sso', userAgent: '*' },
			{ disallow: '/', userAgent: disallowBots },
		],
		sitemap: `https://${baseURL}/sitemap.xml`,
	};
}
