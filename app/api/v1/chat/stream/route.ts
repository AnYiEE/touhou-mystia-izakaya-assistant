import { randomUUID } from 'node:crypto';
import { type NextRequest } from 'next/server';

import {
	type IChatSseEvent,
	subscribeChatEvents,
} from '@/lib/chat/server/realtimeService';
import {
	createChatErrorResponse,
	requireChatAccountAuth,
} from '@/lib/chat/server/requestGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

function encodeEvent(event: IChatSseEvent) {
	return encoder.encode(
		`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
	);
}

export async function GET(request: NextRequest) {
	const authResult = await requireChatAccountAuth(request, 'chat-stream');
	if (authResult.status === 'error') {
		return authResult.response;
	}

	try {
		const userId = authResult.auth.data.user.id;
		const listenerId = randomUUID();

		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(
					encodeEvent({ data: { userId }, type: 'chat.connected' })
				);

				const unsubscribe = subscribeChatEvents(
					userId,
					listenerId,
					(event) => {
						controller.enqueue(encodeEvent(event));
					}
				);

				const heartbeat = setInterval(() => {
					controller.enqueue(encoder.encode(': ping\n\n'));
				}, 15000);

				const close = () => {
					clearInterval(heartbeat);
					unsubscribe();
					try {
						controller.close();
					} catch {
						/* controller already closed */
					}
				};

				request.signal.addEventListener('abort', close, { once: true });
			},
		});

		return new Response(stream, {
			headers: {
				'Cache-Control': 'no-store',
				Connection: 'keep-alive',
				'Content-Type': 'text/event-stream; charset=utf-8',
				Vary: 'Cookie',
			},
		});
	} catch (error) {
		return createChatErrorResponse(error);
	}
}
