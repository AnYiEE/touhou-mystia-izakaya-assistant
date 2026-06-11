import {
	createHash,
	createHmac,
	randomBytes,
	timingSafeEqual,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
	type IncomingMessage,
	type ServerResponse,
	createServer,
} from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { env, exit } from 'node:process';

type THttpMethod = 'GET' | 'POST';
type TStartMode = 'bad-pkce' | 'normal';

interface IApiEnvelope {
	data: unknown;
	message: string | null;
	status: 'error' | 'ok';
}

interface IConfig {
	callbackTimestampToleranceMs: number;
	clientId: string;
	clientSecret: string;
	host: string;
	httpsCert: string | null;
	httpsKey: string | null;
	httpsOrigin: string | null;
	httpsPort: number | null;
	mockOrigin: string;
	mystiaOrigin: string;
	port: number;
}

interface IFlowState {
	codeVerifier: string;
	mode: TStartMode;
	state: string;
	startedAt: number;
}

interface ILastCallback {
	codeVerifier: string;
	mode: TStartMode;
	receivedAt: number;
	state: string;
	ticket: string;
}

interface ICallbackVerificationResult {
	reason?: string;
	valid: boolean;
}

interface ILastCallbackEvent {
	body: string;
	header: string | null;
	receivedAt: number;
	verification: ICallbackVerificationResult;
}

interface ILastUser {
	id: string;
	status: string;
	username?: string;
}

interface IPostJsonResult {
	data: unknown;
	message: string | null;
	ok: boolean;
	statusCode: number;
	text: string;
}

interface IHomeRenderOptions {
	config: IConfig;
	lastCallbackEvent: ILastCallbackEvent | null;
	lastStatusResult: string | null;
	lastValidateResult: string | null;
}

function isHttpMethod(method: string): method is THttpMethod {
	return method === 'GET' || method === 'POST';
}

function normalizeOrigin(value: string) {
	const url = new URL(value);

	return url.origin;
}

function readRequiredEnv(name: string) {
	const value = env[name]?.trim() ?? '';
	if (value.length === 0) {
		console.error(`Missing ${name}.`);
		console.error(
			'Example: $env:SSO_CLIENT_ID="..."; $env:SSO_CLIENT_SECRET="..."; pnpm sso:mock'
		);
		exit(1);
	}

	return value;
}

function readConfig(): IConfig {
	const clientId = readRequiredEnv('SSO_CLIENT_ID');
	const clientSecret = readRequiredEnv('SSO_CLIENT_SECRET');
	const mystiaOrigin = normalizeOrigin(
		env['MYSTIA_ORIGIN'] ?? 'http://localhost:3000'
	);
	const mockOrigin = normalizeOrigin(
		env['SSO_MOCK_ORIGIN'] ?? 'http://127.0.0.1:4000'
	);
	const mockUrl = new URL(mockOrigin);
	const host = mockUrl.hostname;
	const port = Number(
		mockUrl.port || (mockUrl.protocol === 'https:' ? 443 : 80)
	);
	if (mockUrl.protocol !== 'http:') {
		console.error(
			'SSO_MOCK_ORIGIN must be an http origin for this no-dependency mock server.'
		);
		exit(1);
	}
	if (!Number.isSafeInteger(port) || port <= 0 || port > 65_535) {
		console.error('SSO_MOCK_ORIGIN must include a valid port.');
		exit(1);
	}

	const httpsKeyPath = env['SSO_MOCK_HTTPS_KEY']?.trim() ?? '';
	const httpsCertPath = env['SSO_MOCK_HTTPS_CERT']?.trim() ?? '';
	const hasHttps = httpsKeyPath.length > 0 && httpsCertPath.length > 0;
	let httpsKey: string | null = null;
	let httpsCert: string | null = null;
	let httpsPort: number | null = null;
	let httpsOrigin: string | null = null;
	if (hasHttps) {
		try {
			httpsKey = readFileSync(httpsKeyPath, 'utf8');
			httpsCert = readFileSync(httpsCertPath, 'utf8');
		} catch (error) {
			console.error('Failed to read HTTPS key or cert file.', error);
			exit(1);
		}

		httpsPort = Number(env['SSO_MOCK_HTTPS_PORT'] ?? 4443);
		if (
			!Number.isSafeInteger(httpsPort) ||
			httpsPort <= 0 ||
			httpsPort > 65_535
		) {
			console.error('SSO_MOCK_HTTPS_PORT must be a valid port.');
			exit(1);
		}
		httpsOrigin = `https://${host}:${httpsPort}`;
	}

	return {
		callbackTimestampToleranceMs: 5 * 60 * 1000,
		clientId,
		clientSecret,
		host,
		httpsCert,
		httpsKey,
		httpsOrigin,
		httpsPort,
		mockOrigin,
		mystiaOrigin,
		port,
	};
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function renderPre(value: unknown) {
	const text =
		typeof value === 'string' ? value : JSON.stringify(value, null, 2);

	return `<pre>${escapeHtml(text)}</pre>`;
}

function renderPage(title: string, content: string) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
body { color: #1f2937; font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; margin: 2rem auto; max-width: 960px; padding: 0 1rem; }
a { color: #0f766e; }
code, pre { background: #f3f4f6; border-radius: 6px; }
code { padding: 0.1rem 0.25rem; }
pre { overflow: auto; padding: 1rem; white-space: pre-wrap; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0; }
.actions a { border: 1px solid #99f6e4; border-radius: 6px; padding: 0.5rem 0.75rem; text-decoration: none; }
section { margin: 1.25rem 0; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${content}
</body>
</html>`;
}

function renderResult(title: string, value: string | null) {
	return `<section><h2>${escapeHtml(title)}</h2>${renderPre(
		value ?? 'Not available yet.'
	)}</section>`;
}

function renderActions(config: IConfig) {
	const links = [
		'<nav class="actions">',
		'<a href="/start">Start normal SSO (loopback)</a>',
		'<a href="/start?mode=bad-pkce">Start SSO with bad PKCE first (loopback)</a>',
	];
	if (config.httpsOrigin !== null) {
		links.push(
			'<a href="/start?redirect=https">Start normal SSO (HTTPS)</a>',
			'<a href="/start?redirect=https&amp;mode=bad-pkce">Start SSO with bad PKCE first (HTTPS)</a>'
		);
	}
	links.push(
		'<a href="/validate-last">Validate last ticket with correct PKCE</a>',
		'<a href="/validate-bad-pkce">Validate last ticket with bad PKCE</a>',
		'<a href="/status">Check last user status</a>',
		'<a href="/">Refresh dashboard</a>',
		'</nav>'
	);
	return links.join('');
}

function renderConfig(config: IConfig) {
	const result: Record<string, unknown> = {
		cancel_redirect_uri: `${config.mockOrigin}/cancel`,
		client_id: config.clientId,
		mystia_origin: config.mystiaOrigin,
		redirect_uri_loopback: `${config.mockOrigin}/callback`,
		status_callback_url:
			config.httpsOrigin === null
				? 'HTTPS not configured; set SSO_MOCK_HTTPS_KEY + SSO_MOCK_HTTPS_CERT'
				: `${config.httpsOrigin}/status-callback`,
	};
	if (config.httpsOrigin !== null) {
		result['redirect_uri_https'] = `${config.httpsOrigin}/callback`;
	}

	return renderResult('Current config', JSON.stringify(result, null, 2));
}

function renderCallbackEvent(event: ILastCallbackEvent | null) {
	if (event === null) {
		return renderResult(
			'Last status callback',
			'No status callback received yet.'
		);
	}

	return renderResult('Last status callback', JSON.stringify(event, null, 2));
}

function renderHome(options: IHomeRenderOptions) {
	return renderPage(
		'Mystia SSO Mock Client',
		[
			'<p>This local server simulates an external SSO client backend.</p>',
			renderConfig(options.config),
			renderActions(options.config),
			renderResult('Last validate result', options.lastValidateResult),
			renderResult('Last status result', options.lastStatusResult),
			renderCallbackEvent(options.lastCallbackEvent),
		].join('')
	);
}

function writeHtml(response: ServerResponse, status: number, body: string) {
	response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
	response.end(body);
}

function writeJson(response: ServerResponse, status: number, body: unknown) {
	response.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
	});
	response.end(JSON.stringify(body, null, 2));
}

function writeText(response: ServerResponse, status: number, body: string) {
	response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
	response.end(body);
}

function redirect(response: ServerResponse, url: URL) {
	response.writeHead(302, { Location: url.toString() });
	response.end();
}

function createToken(byteLength: number) {
	return randomBytes(byteLength).toString('base64url');
}

function createCodeChallenge(codeVerifier: string) {
	return createHash('sha256').update(codeVerifier).digest('base64url');
}

function parseStartMode(value: string | null): TStartMode {
	return value === 'bad-pkce' ? 'bad-pkce' : 'normal';
}

function formatJsonText(text: string) {
	try {
		return JSON.stringify(JSON.parse(text), null, 2);
	} catch {
		return text;
	}
}

function getObjectProperty(value: object, key: string): unknown {
	if (!Object.keys(value).includes(key)) {
		return undefined;
	}

	return (value as Record<string, unknown>)[key];
}

function parseApiEnvelope(text: string): IApiEnvelope {
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		return { data: null, message: 'invalid-api-response', status: 'error' };
	}
	if (value === null || Array.isArray(value) || typeof value !== 'object') {
		return { data: null, message: 'invalid-api-response', status: 'error' };
	}

	const status = getObjectProperty(value, 'status');
	if (status !== 'ok' && status !== 'error') {
		return { data: null, message: 'invalid-api-response', status: 'error' };
	}

	const data = getObjectProperty(value, 'data') ?? null;
	const messageValue = getObjectProperty(value, 'message');
	const message = typeof messageValue === 'string' ? messageValue : null;

	return { data, message, status };
}

async function postJson(
	config: IConfig,
	pathname: string,
	body: Record<string, string>
): Promise<IPostJsonResult> {
	const url = new URL(pathname, config.mystiaOrigin);
	const response = await fetch(url, {
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	});
	const text = await response.text();
	const parsed = parseApiEnvelope(text);

	return {
		data: parsed.data,
		message: parsed.message,
		ok: response.ok && parsed.status === 'ok',
		statusCode: response.status,
		text: `HTTP ${response.status}\n${formatJsonText(text)}`,
	};
}

function parseSignatureHeader(header: string) {
	const pairs = new Map(
		header.split(',').map((part) => {
			const [key = '', value = ''] = part.split('=');

			return [key.trim(), value.trim()] as const;
		})
	);
	const timestampText = pairs.get('t');
	const signature = pairs.get('v1');
	if (timestampText === undefined || signature === undefined) {
		return null;
	}
	const timestamp = Number(timestampText);
	if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
		return null;
	}

	return { signature, timestamp };
}

function timingSafeBase64UrlEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	return (
		leftBuffer.length === rightBuffer.length &&
		timingSafeEqual(leftBuffer, rightBuffer)
	);
}

function verifyCallbackSignature(
	config: IConfig,
	header: string | null,
	body: string
): ICallbackVerificationResult {
	if (header === null) {
		return { reason: 'missing-signature-header', valid: false };
	}

	const parsed = parseSignatureHeader(header);
	if (parsed === null) {
		return { reason: 'invalid-signature-header', valid: false };
	}

	const { signature, timestamp } = parsed;
	const skewMs = Math.abs(Date.now() - timestamp);
	if (skewMs > config.callbackTimestampToleranceMs) {
		return { reason: 'timestamp-out-of-range', valid: false };
	}

	const signingSecret = createHash('sha256')
		.update(config.clientSecret)
		.digest('hex');
	const expected = createHmac('sha256', signingSecret)
		.update(`${timestamp}.${body}`)
		.digest('base64url');
	if (!timingSafeBase64UrlEqual(signature, expected)) {
		return { reason: 'signature-mismatch', valid: false };
	}

	return { valid: true };
}

function readRequestBody(request: IncomingMessage) {
	return new Promise<string>((resolve, reject) => {
		const chunks: Buffer[] = [];
		request.on('data', (chunk: Buffer) => {
			chunks.push(chunk);
		});
		request.on('end', () => {
			resolve(Buffer.concat(chunks).toString('utf8'));
		});
		request.on('error', reject);
	});
}

function getHeader(request: IncomingMessage, name: string) {
	const value = request.headers[name.toLowerCase()];
	if (Array.isArray(value)) {
		return value[0] ?? null;
	}

	return value ?? null;
}

function isValidateResponseData(value: unknown): value is { user: ILastUser } {
	if (value === null || Array.isArray(value) || typeof value !== 'object') {
		return false;
	}
	const user = getObjectProperty(value, 'user');
	if (user === null || Array.isArray(user) || typeof user !== 'object') {
		return false;
	}

	return (
		typeof getObjectProperty(user, 'id') === 'string' &&
		typeof getObjectProperty(user, 'status') === 'string'
	);
}

class MockSsoClient {
	private currentFlow: IFlowState | null = null;
	private lastCallback: ILastCallback | null = null;
	private lastCallbackEvent: ILastCallbackEvent | null = null;
	private lastStatusResult: string | null = null;
	private lastUser: ILastUser | null = null;
	private lastValidateResult: string | null = null;
	private readonly config: IConfig;

	constructor(config: IConfig) {
		this.config = config;
	}

	start() {
		const handle = this.createRequestHandler();

		const httpServer = createServer(handle);
		httpServer.listen(this.config.port, this.config.host, () => {
			console.log(`HTTP redirect: ${this.config.mockOrigin}`);
			console.log(`Dashboard:    ${this.config.mockOrigin}/`);
		});

		if (
			this.config.httpsKey !== null &&
			this.config.httpsCert !== null &&
			this.config.httpsOrigin !== null &&
			this.config.httpsPort !== null
		) {
			const httpsServer = createHttpsServer(
				{ cert: this.config.httpsCert, key: this.config.httpsKey },
				handle
			);
			httpsServer.listen(this.config.httpsPort, this.config.host, () => {
				console.log(`HTTPS dashboard: ${this.config.httpsOrigin}/`);
				console.log(
					`HTTPS callback:  ${this.config.httpsOrigin}/status-callback`
				);
			});
		}

		console.log(`Mystia origin: ${this.config.mystiaOrigin}`);
	}

	private createRequestHandler() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;

		return (request: IncomingMessage, response: ServerResponse) => {
			void self
				.handleRequest(request, response)
				.catch((error: unknown) => {
					console.error('Mock SSO client request failed.', error);
					writeHtml(
						response,
						500,
						renderPage('Server error', renderPre(error))
					);
				});
		};
	}

	private async handleRequest(
		request: IncomingMessage,
		response: ServerResponse
	) {
		const method = request.method ?? 'GET';
		const url = new URL(request.url ?? '/', this.config.mockOrigin);
		if (!isHttpMethod(method)) {
			writeText(response, 405, 'method not allowed');
			return;
		}

		if (method === 'POST' && url.pathname === '/status-callback') {
			await this.handleStatusCallback(request, response);
			return;
		}

		if (method !== 'GET') {
			writeText(response, 405, 'method not allowed');
			return;
		}

		switch (url.pathname) {
			case '/':
				writeHtml(response, 200, this.renderHome());
				break;
			case '/callback':
				await this.handleCallback(url, response);
				break;
			case '/cancel':
				writeHtml(
					response,
					200,
					renderPage(
						'Authorization cancelled',
						'<p>SSO authorization was cancelled.</p>'
					)
				);
				break;
			case '/start':
				this.handleStart(url, response);
				break;
			case '/status':
				await this.handleStatus(response);
				break;
			case '/validate-bad-pkce':
				await this.handleValidateBadPkce(response);
				break;
			case '/validate-last':
				await this.handleValidateLast(response);
				break;
			default:
				writeHtml(
					response,
					404,
					renderPage('Not found', '<p>Unknown mock route.</p>')
				);
		}
	}

	private handleStart(url: URL, response: ServerResponse) {
		const mode = parseStartMode(url.searchParams.get('mode'));
		const state = createToken(24);
		const codeVerifier = createToken(32);
		const codeChallenge = createCodeChallenge(codeVerifier);
		this.currentFlow = { codeVerifier, mode, startedAt: Date.now(), state };

		const useHttpsRedirect =
			url.searchParams.get('redirect') === 'https' &&
			this.config.httpsOrigin !== null;
		const redirectOrigin = useHttpsRedirect
			? this.config.httpsOrigin
			: this.config.mockOrigin;

		const authorizeUrl = new URL(
			'/api/v1/sso/authorize',
			this.config.mystiaOrigin
		);
		authorizeUrl.searchParams.set('client_id', this.config.clientId);
		authorizeUrl.searchParams.set('code_challenge', codeChallenge);
		authorizeUrl.searchParams.set(
			'redirect_uri',
			`${redirectOrigin}/callback`
		);
		authorizeUrl.searchParams.set('state', state);

		redirect(response, authorizeUrl);
	}

	private async handleCallback(url: URL, response: ServerResponse) {
		const ticket = url.searchParams.get('ticket')?.trim() ?? '';
		const state = url.searchParams.get('state')?.trim() ?? '';
		if (ticket.length === 0 || state.length === 0) {
			writeHtml(
				response,
				400,
				renderPage(
					'Missing callback parameters',
					'<p>The callback must include both <code>ticket</code> and <code>state</code>.</p>'
				)
			);
			return;
		}
		if (this.currentFlow?.state !== state) {
			writeHtml(
				response,
				400,
				renderPage(
					'State mismatch',
					renderPre({
						expected: this.currentFlow?.state ?? null,
						received: state,
					})
				)
			);
			return;
		}

		const { codeVerifier, mode } = this.currentFlow;
		this.lastCallback = {
			codeVerifier,
			mode,
			receivedAt: Date.now(),
			state,
			ticket,
		};
		const verifier = mode === 'bad-pkce' ? createToken(32) : codeVerifier;
		const result = await this.validateTicket(ticket, verifier);
		this.lastValidateResult = result.text;
		if (result.ok && isValidateResponseData(result.data)) {
			this.lastUser = result.data.user;
		}

		writeHtml(
			response,
			200,
			renderPage(
				'Callback received',
				[
					`<p>The mock client received the SSO callback and called <code>/api/v1/sso/validate</code> with <code>${mode === 'bad-pkce' ? 'bad' : 'correct'} PKCE</code>.</p>`,
					renderResult('Validate result', result.text),
					renderActions(this.config),
				].join('')
			)
		);
	}

	private async handleStatus(response: ServerResponse) {
		if (this.lastUser === null) {
			writeHtml(
				response,
				400,
				renderPage(
					'No user yet',
					'<p>Complete a successful SSO validate first.</p>'
				)
			);
			return;
		}

		const result = await postJson(this.config, '/api/v1/sso/status', {
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
			user_id: this.lastUser.id,
		});
		this.lastStatusResult = result.text;
		writeHtml(
			response,
			200,
			renderPage(
				'Status result',
				[
					renderResult('Status response', result.text),
					renderActions(this.config),
				].join('')
			)
		);
	}

	private async handleValidateBadPkce(response: ServerResponse) {
		if (this.lastCallback === null) {
			writeHtml(
				response,
				400,
				renderPage(
					'No ticket yet',
					'<p>Complete an authorization callback first.</p>'
				)
			);
			return;
		}

		const result = await this.validateTicket(
			this.lastCallback.ticket,
			createToken(32)
		);
		this.lastValidateResult = result.text;
		writeHtml(
			response,
			200,
			renderPage(
				'Bad PKCE validate result',
				[
					'<p>Expected result for an unconsumed ticket: <code>401 invalid-ticket</code>. If the ticket was already consumed, the result is also <code>401 invalid-ticket</code>.</p>',
					renderResult('Validate response', result.text),
					renderActions(this.config),
				].join('')
			)
		);
	}

	private async handleValidateLast(response: ServerResponse) {
		if (this.lastCallback === null) {
			writeHtml(
				response,
				400,
				renderPage(
					'No ticket yet',
					'<p>Complete an authorization callback first.</p>'
				)
			);
			return;
		}

		const result = await this.validateTicket(
			this.lastCallback.ticket,
			this.lastCallback.codeVerifier
		);
		this.lastValidateResult = result.text;
		if (result.ok && isValidateResponseData(result.data)) {
			this.lastUser = result.data.user;
		}
		writeHtml(
			response,
			200,
			renderPage(
				'Correct PKCE validate result',
				[
					'<p>Expected result after a normal callback: <code>401 invalid-ticket</code>. Expected result after a bad-PKCE-first callback: <code>HTTP 200</code>.</p>',
					renderResult('Validate response', result.text),
					renderActions(this.config),
				].join('')
			)
		);
	}

	private async handleStatusCallback(
		request: IncomingMessage,
		response: ServerResponse
	) {
		const body = await readRequestBody(request);
		const header = getHeader(request, 'x-sso-signature');
		const verification = verifyCallbackSignature(this.config, header, body);
		this.lastCallbackEvent = {
			body,
			header,
			receivedAt: Date.now(),
			verification,
		};

		writeJson(response, 200, { received: true, verification });
	}

	private async validateTicket(ticket: string, codeVerifier: string) {
		return postJson(this.config, '/api/v1/sso/validate', {
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
			code_verifier: codeVerifier,
			ticket,
		});
	}

	private renderHome() {
		return renderHome({
			config: this.config,
			lastCallbackEvent: this.lastCallbackEvent,
			lastStatusResult: this.lastStatusResult,
			lastValidateResult: this.lastValidateResult,
		});
	}
}

new MockSsoClient(readConfig()).start();
