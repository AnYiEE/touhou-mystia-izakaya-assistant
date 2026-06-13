import sanitizeHtml from 'sanitize-html';

const ANNOUNCEMENT_USER_ID_TEMPLATE_REGEXP = /\{\{\s*user\.id\s*\}\}/gu;
const ANNOUNCEMENT_USERNAME_TEMPLATE_REGEXP = /\{\{\s*user\.username\s*\}\}/gu;

const ANNOUNCEMENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
	allowedAttributes: {
		a: ['href', 'rel', 'style', 'target'],
		b: ['style'],
		code: ['style'],
		em: ['style'],
		i: ['style'],
		li: ['style'],
		ol: ['style'],
		p: ['style'],
		span: ['style'],
		strong: ['style'],
		ul: ['style'],
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedStyles: {
		'*': {
			'background-color': [
				/^#[\da-f]{3,8}$/iu,
				/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/iu,
				/^hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/iu,
				/^[a-z]+$/iu,
			],
			color: [
				/^#[\da-f]{3,8}$/iu,
				/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/iu,
				/^hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/iu,
				/^[a-z]+$/iu,
			],
			'font-style': [/^(?:italic|normal|oblique)$/iu],
			'font-weight': [/^(?:normal|bold|bolder|lighter|[1-9]00)$/iu],
			'text-align': [/^(?:left|center|right|start|end)$/iu],
			'text-decoration': [/^(?:none|underline|line-through|overline)$/iu],
		},
	},
	allowedTags: [
		'a',
		'strong',
		'b',
		'em',
		'i',
		'code',
		'br',
		'span',
		'p',
		'ul',
		'ol',
		'li',
	],
	allowProtocolRelative: false,
	parseStyleAttributes: true,
	transformTags: {
		a: (_tagName, attribs) => {
			const { href, style } = attribs;

			return {
				attribs: {
					...(typeof href === 'string' ? { href } : {}),
					...(typeof style === 'string' ? { style } : {}),
					rel: 'noopener noreferrer',
					target: '_blank',
				},
				tagName: 'a',
			};
		},
	},
};

const VISIBLE_TEXT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
	allowedAttributes: {},
	allowedTags: [],
};

function escapeHtmlText(value: string) {
	return value.replaceAll(/[&<>"]/gu, (character) => {
		switch (character) {
			case '&':
				return '&amp;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '"':
				return '&quot;';
			default:
				return character;
		}
	});
}

export function sanitizeAnnouncementHtml(html: string) {
	return sanitizeHtml(html, ANNOUNCEMENT_SANITIZE_OPTIONS).trim();
}

export function renderAnnouncementHtmlTemplate(
	html: string,
	context: { userId: string | null; username: string | null }
) {
	return html
		.replaceAll(
			ANNOUNCEMENT_USERNAME_TEMPLATE_REGEXP,
			escapeHtmlText(context.username ?? '游客')
		)
		.replaceAll(
			ANNOUNCEMENT_USER_ID_TEMPLATE_REGEXP,
			escapeHtmlText(context.userId ?? '')
		);
}

export function getAnnouncementVisibleText(html: string) {
	return sanitizeHtml(html, VISIBLE_TEXT_SANITIZE_OPTIONS)
		.replaceAll(/\s+/gu, ' ')
		.trim();
}

export function checkAnnouncementHtmlVisible(html: string) {
	return getAnnouncementVisibleText(html).length > 0;
}
