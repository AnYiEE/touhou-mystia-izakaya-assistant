/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import {type NextRequest} from 'next/server';
import {sha1} from 'js-sha1';

export function getRequestMeta(request: NextRequest) {
	const contentType = request.headers.get('content-type') || null;

	let ip =
		(request.headers.get('x-real-ip')?.trim() ||
			request.headers.get('x-forwarded-for')?.split(',').at(0)?.trim()) ??
		null;
	if (ip?.startsWith('::ffff:')) {
		ip = ip.slice(7);
	}
	if (ip !== null) {
		ip = sha1(ip);
	}

	let ua = request.headers.get('user-agent')?.trim() || null;
	if (ua !== null) {
		ua = sha1(ua);
	}

	return {
		contentType,
		ip,
		ua,
	};
}
