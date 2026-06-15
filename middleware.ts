import { type NextRequest, NextResponse } from 'next/server';

import {
	applyServiceCorsHeaders,
	createServiceCorsPreflightResponse,
} from '@/lib/api/cors';

export function middleware(request: NextRequest) {
	if (request.method === 'OPTIONS') {
		return createServiceCorsPreflightResponse(request);
	}

	const response = NextResponse.next();
	applyServiceCorsHeaders(response.headers, request);

	return response;
}

export const config = { matcher: '/api/v1/:path*' };
