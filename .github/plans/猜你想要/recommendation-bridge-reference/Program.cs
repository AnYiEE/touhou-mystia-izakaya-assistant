using System.Buffers;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

const int Port = 38421;
const int MaxMessageBytes = 32_768;
const int HandshakeTimeoutMs = 5_000;
const int HeartbeatIntervalMs = 30_000;
const int MaxInFlight = 4;
const long MaxSafeInteger = 9_007_199_254_740_991;

var allowedOrigin = Environment.GetEnvironmentVariable("BRIDGE_ALLOWED_ORIGIN")
	?? "http://localhost:3000";
var pageUrl = Environment.GetEnvironmentVariable("BRIDGE_PAGE_URL")
	?? "http://localhost:3000";
var instanceId = Base64Url(RandomNumberGenerator.GetBytes(16));
var state = new BridgeState();

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.ListenLocalhost(Port));
var app = builder.Build();
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.Zero });
app.Map("/bridge", HandleBridgeAsync);

var serverTask = app.RunAsync();
Console.WriteLine($"Reference bridge listening on loopback port {Port}.");
Console.WriteLine($"Allowed Origin: {allowedOrigin}");
LaunchPage();

while (true)
{
	Console.WriteLine("Press Enter to relaunch with a new token, or q to quit.");
	var command = Console.ReadLine();
	if (string.Equals(command, "q", StringComparison.OrdinalIgnoreCase))
	{
		break;
	}
	LaunchPage();
}

await app.StopAsync();
await serverTask;

void LaunchPage()
{
	var token = Base64Url(RandomNumberGenerator.GetBytes(32));
	state.SetLatestPendingToken(token);
	var descriptor = JsonSerializer.Serialize(new
	{
		endpoint = $"ws://localhost:{Port}/bridge",
		instance_id = instanceId,
		pairing_token = token,
		protocol_version = 1,
	});
	var launchUrl = $"{pageUrl.TrimEnd('/')}/#game-bridge={Base64Url(Encoding.UTF8.GetBytes(descriptor))}";
	Console.WriteLine($"Launch URL prepared for instance {instanceId}; pairing token is intentionally redacted.");
	try
	{
		Process.Start(new ProcessStartInfo(launchUrl) { UseShellExecute = true });
	}
	catch (Exception error)
	{
		Console.WriteLine($"Browser launch failed ({error.GetType().Name}); open the prepared URL in a local debugger without logging it.");
	}
}

async Task HandleBridgeAsync(HttpContext context)
{
	if (!context.WebSockets.IsWebSocketRequest)
	{
		context.Response.StatusCode = StatusCodes.Status400BadRequest;
		return;
	}
	if (!string.Equals(context.Request.Headers.Origin, allowedOrigin, StringComparison.Ordinal))
	{
		context.Response.StatusCode = StatusCodes.Status403Forbidden;
		return;
	}

	using var socket = await context.WebSockets.AcceptWebSocketAsync();
	using var handshakeCancellation = new CancellationTokenSource(HandshakeTimeoutMs);
	string? helloText;
	try
	{
		helloText = await ReceiveTextAsync(socket, handshakeCancellation.Token);
	}
	catch (OperationCanceledException)
	{
		await CloseAsync(socket, 4004, "handshake-timeout");
		return;
	}
	if (helloText is null)
	{
		return;
	}
	var helloResult = TryReadHello(helloText, out var token, out var negotiatedMaxInFlight);
	if (helloResult != HelloReadResult.Valid)
	{
		var (closeCode, reason) = helloResult switch
		{
			HelloReadResult.PairingFailed => (4002, "pairing-failed"),
			HelloReadResult.UnsupportedProtocol => (4003, "unsupported-protocol"),
			_ => (4005, "invalid-message"),
		};
		await CloseAsync(socket, closeCode, reason);
		return;
	}

	var connection = new AuthenticatedConnection(socket, token, negotiatedMaxInFlight);
	var previous = state.Promote(connection);
	if (previous is null && !state.IsCurrent(connection))
	{
		await CloseAsync(socket, 4002, "pairing-failed");
		return;
	}
	if (previous is not null)
	{
		await previous.TrySendAsync(JsonSerializer.Serialize(new
		{
			type = "bridge.replaced",
			instance_id = instanceId,
		}));
		await CloseAsync(previous.Socket, 4001, "connection-replaced");
	}

	await connection.TrySendAsync(JsonSerializer.Serialize(new
	{
		type = "bridge.ready",
		protocol_version = 1,
		instance_id = instanceId,
		max_in_flight = connection.MaxInFlight,
		heartbeat_interval_ms = HeartbeatIntervalMs,
	}));

	using var connectionCancellation = new CancellationTokenSource();
	var receiveTask = ReceiveLoopAsync(connection, connectionCancellation.Token);
	var heartbeatTask = HeartbeatLoopAsync(connection, connectionCancellation.Token);
	var examplesTask = RunExamplesAsync(connection, connectionCancellation.Token);
	var stabilityTask = ResetClientUpdateAfterStableAsync(connection, connectionCancellation.Token);
	await receiveTask;
	connectionCancellation.Cancel();
	await IgnoreCancellationAsync(heartbeatTask);
	await IgnoreCancellationAsync(examplesTask);
	await IgnoreCancellationAsync(stabilityTask);
	state.Remove(connection);
}

HelloReadResult TryReadHello(string text, out string token, out int negotiatedMaxInFlight)
{
	token = string.Empty;
	negotiatedMaxInFlight = 0;
	if (Encoding.UTF8.GetByteCount(text) > MaxMessageBytes || !HasUniqueJsonMembers(text))
	{
		return HelloReadResult.InvalidMessage;
	}
	try
	{
		using var document = JsonDocument.Parse(text);
		var root = document.RootElement;
		if (root.ValueKind != JsonValueKind.Object
			|| !root.TryGetProperty("type", out var type)
			|| type.ValueKind != JsonValueKind.String
			|| type.GetString() != "bridge.hello"
			|| !root.TryGetProperty("protocol_version", out var version)
			|| !version.TryGetInt32(out var protocolVersion)
			|| !root.TryGetProperty("instance_id", out var instance)
			|| instance.ValueKind != JsonValueKind.String
			|| !root.TryGetProperty("pairing_token", out var pairing)
			|| pairing.ValueKind != JsonValueKind.String
			|| !root.TryGetProperty("max_in_flight", out var clientMaxInFlight)
			|| !clientMaxInFlight.TryGetInt32(out var clientMaxInFlightValue)
			|| clientMaxInFlightValue < 1
			|| !root.TryGetProperty("client", out var client)
			|| client.ValueKind != JsonValueKind.Object
			|| !client.TryGetProperty("name", out var clientName)
			|| clientName.ValueKind != JsonValueKind.String
			|| clientName.GetString() != "touhou-mystia-izakaya-assistant"
			|| !client.TryGetProperty("version", out var clientVersion)
			|| !CheckPrintableAscii(clientVersion, 1, 64))
		{
			return HelloReadResult.InvalidMessage;
		}
		if (protocolVersion != 1)
		{
			return HelloReadResult.UnsupportedProtocol;
		}
		token = pairing.GetString() ?? string.Empty;
		if (instance.GetString() != instanceId || !state.CheckToken(token))
		{
			return HelloReadResult.PairingFailed;
		}
		negotiatedMaxInFlight = Math.Min(MaxInFlight, clientMaxInFlightValue);
		return HelloReadResult.Valid;
	}
	catch (JsonException)
	{
		return HelloReadResult.InvalidMessage;
	}
}

async Task ReceiveLoopAsync(AuthenticatedConnection connection, CancellationToken cancellationToken)
{
	try
	{
		while (connection.Socket.State == WebSocketState.Open)
		{
			var text = await ReceiveTextAsync(connection.Socket, cancellationToken);
			if (text is null)
			{
				if (connection.Socket.CloseStatus == (WebSocketCloseStatus)4006)
				{
					connection.MarkClientUpdate();
				}
				return;
			}
			if (Encoding.UTF8.GetByteCount(text) > MaxMessageBytes || !HasUniqueJsonMembers(text))
			{
				await CloseAsync(connection.Socket, 4005, "invalid-message");
				return;
			}
			using var document = JsonDocument.Parse(text);
			var root = document.RootElement;
			if (root.ValueKind != JsonValueKind.Object
				|| !root.TryGetProperty("type", out var typeElement)
				|| typeElement.ValueKind != JsonValueKind.String)
			{
				await CloseAsync(connection.Socket, 4005, "invalid-message");
				return;
			}
			var type = typeElement.GetString();
			switch (type)
			{
				case "bridge.pong":
					if (!TryReadSafeNonNegativeInteger(root, "timestamp", out var pongTimestamp))
					{
						await CloseAsync(connection.Socket, 4005, "invalid-message");
						return;
					}
					connection.AcceptPong(pongTimestamp);
					break;
				case "bridge.closing":
					if (!TryReadString(root, "reason", out var reason)
						|| reason != "client-update")
					{
						await CloseAsync(connection.Socket, 4005, "invalid-message");
						return;
					}
					connection.MarkClientUpdate();
					break;
				case "recommendation.result":
					if (!TryReadResult(root, out var resultRequestId))
					{
						await CloseAsync(connection.Socket, 4005, "invalid-message");
						return;
					}
					ReadResult(root, resultRequestId);
					connection.CompleteRequest(resultRequestId);
					break;
				case "recommendation.cancelled":
					if (!TryReadRequestId(root, out var cancelledRequestId))
					{
						await CloseAsync(connection.Socket, 4005, "invalid-message");
						return;
					}
					Console.WriteLine($"Request {cancelledRequestId} was cancelled.");
					connection.CompleteRequest(cancelledRequestId);
					break;
				case "recommendation.error":
					if (!TryReadRecommendationError(root, out var errorRequestId, out var recommendationErrorCode))
					{
						await CloseAsync(connection.Socket, 4005, "invalid-message");
						return;
					}
					Console.WriteLine($"Request {errorRequestId} failed with stable code {recommendationErrorCode}.");
					connection.CompleteRequest(errorRequestId);
					break;
				case "bridge.error":
					if (!TryReadString(root, "code", out var bridgeErrorCode)
						|| bridgeErrorCode is not ("invalid-message" or "unsupported-message"))
					{
						await CloseAsync(connection.Socket, 4005, "invalid-message");
						return;
					}
					Console.WriteLine($"Bridge input error: {bridgeErrorCode}.");
					break;
				default:
					await CloseAsync(connection.Socket, 4005, "invalid-message");
					return;
			}
		}
	}
	catch (OperationCanceledException)
	{
	}
	catch (WebSocketException)
	{
	}
	finally
	{
		if (connection.ClientUpdateSeen && state.TryClaimClientUpdateRelaunch())
		{
			await Task.Delay(1_000, CancellationToken.None);
			LaunchPage();
		}
	}
}

async Task HeartbeatLoopAsync(AuthenticatedConnection connection, CancellationToken cancellationToken)
{
	var missedPongs = 0;
	while (!cancellationToken.IsCancellationRequested)
	{
		await Task.Delay(HeartbeatIntervalMs, cancellationToken);
		if (connection.HasPendingPong())
		{
			missedPongs++;
			if (missedPongs >= 2)
			{
				await connection.Socket.CloseAsync(WebSocketCloseStatus.InternalServerError, "heartbeat-timeout", CancellationToken.None);
				return;
			}
		}
		else
		{
			missedPongs = 0;
		}
		var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
		connection.ExpectPong(timestamp);
		await connection.TrySendAsync(JsonSerializer.Serialize(new { type = "bridge.ping", timestamp }));
	}
}

async Task ResetClientUpdateAfterStableAsync(AuthenticatedConnection connection, CancellationToken cancellationToken)
{
	await Task.Delay(30_000, cancellationToken);
	state.ClearClientUpdateRelaunch(connection);
}

async Task RunExamplesAsync(AuthenticatedConnection connection, CancellationToken cancellationToken)
{
	await Task.Delay(250, cancellationToken);
	var filePath = Path.Combine(AppContext.BaseDirectory, "cases.v1.json");
	if (!File.Exists(filePath))
	{
		filePath = Path.Combine(Directory.GetCurrentDirectory(), "cases.v1.json");
	}
	using var document = JsonDocument.Parse(await File.ReadAllTextAsync(filePath, cancellationToken));
	var exampleTasks = new List<Task>();
	foreach (var example in document.RootElement.EnumerateArray())
	{
		Console.WriteLine($"Sending {example.GetProperty("name").GetString()} example.");
		var request = example.GetProperty("request");
		exampleTasks.Add(connection.TrackRequest(ReadRequestId(request)));
		await connection.TrySendAsync(request.GetRawText());
	}
	await Task.WhenAll(exampleTasks).WaitAsync(TimeSpan.FromMinutes(2), cancellationToken);

	for (var batchStart = 0; batchStart <= 4; batchStart += connection.MaxInFlight)
	{
		var ratingTasks = new List<Task>();
		for (var rating = batchStart; rating < Math.Min(batchStart + connection.MaxInFlight, 5); rating++)
		{
			var requestId = $"reference-rating-{rating}";
			ratingTasks.Add(connection.TrackRequest(requestId));
			await connection.TrySendAsync(JsonSerializer.Serialize(new
			{
				type = "recommendation.request",
				request_id = requestId,
				payload = new
				{
					customer = "比那名居天子",
					order = new { recipe_tag = "昂贵", beverage_tag = "高酒精" },
					options = new { max_rating = rating, max_results = 3 },
				},
			}));
		}
		await Task.WhenAll(ratingTasks).WaitAsync(TimeSpan.FromMinutes(2), cancellationToken);
	}

	var cancellationTask = connection.TrackRequest("reference-cancel");
	await connection.TrySendAsync("{\"type\":\"recommendation.request\",\"request_id\":\"reference-cancel\",\"payload\":{\"customer\":\"比那名居天子\",\"order\":{\"recipe_tag\":\"昂贵\",\"beverage_tag\":\"高酒精\"},\"options\":{\"max_results\":10}}}");
	await connection.TrySendAsync("{\"type\":\"recommendation.cancel\",\"request_id\":\"reference-cancel\"}");
	await cancellationTask.WaitAsync(TimeSpan.FromMinutes(2), cancellationToken);

	var invalidTask = connection.TrackRequest("reference-invalid");
	await connection.TrySendAsync("{\"type\":\"recommendation.request\",\"request_id\":\"reference-invalid\",\"payload\":{\"customer\":\"未收录顾客\"}}");
	await invalidTask.WaitAsync(TimeSpan.FromMinutes(2), cancellationToken);
}

static bool CheckPrintableAscii(JsonElement value, int minimumLength, int maximumLength)
{
	if (value.ValueKind != JsonValueKind.String)
	{
		return false;
	}
	var text = value.GetString();
	return text is not null
		&& text.Length >= minimumLength
		&& text.Length <= maximumLength
		&& text.All(character => character is >= ' ' and <= '~');
}

static bool TryReadString(JsonElement root, string propertyName, out string value)
{
	value = string.Empty;
	if (!root.TryGetProperty(propertyName, out var property)
		|| property.ValueKind != JsonValueKind.String)
	{
		return false;
	}
	value = property.GetString() ?? string.Empty;
	return true;
}

static bool TryReadSafeNonNegativeInteger(JsonElement root, string propertyName, out long value)
{
	value = 0;
	return root.TryGetProperty(propertyName, out var property)
		&& property.TryGetInt64(out value)
		&& value >= 0
		&& value <= MaxSafeInteger;
}

static bool TryReadRequestId(JsonElement root, out string requestId)
{
	return TryReadString(root, "request_id", out requestId)
		&& Regex.IsMatch(requestId, @"\A[A-Za-z0-9._:-]{1,128}\z", RegexOptions.CultureInvariant);
}

static bool TryReadResult(JsonElement root, out string requestId)
{
	requestId = string.Empty;
	if (!TryReadRequestId(root, out requestId)
		|| !root.TryGetProperty("meals", out var meals)
		|| meals.ValueKind != JsonValueKind.Array)
	{
		return false;
	}

	foreach (var meal in meals.EnumerateArray())
	{
		if (meal.ValueKind != JsonValueKind.Object
			|| !TryReadString(meal, "beverage", out _)
			|| !TryReadSafeNonNegativeInteger(meal, "price", out _)
			|| !TryReadString(meal, "rating", out var rating)
			|| rating is not ("exbad" or "bad" or "norm" or "good" or "exgood")
			|| !meal.TryGetProperty("recipe", out var recipe)
			|| recipe.ValueKind != JsonValueKind.Object
			|| !TryReadString(recipe, "name", out _)
			|| !recipe.TryGetProperty("extra_ingredients", out var extraIngredients)
			|| extraIngredients.ValueKind != JsonValueKind.Array)
		{
			return false;
		}

		var ingredientNames = new HashSet<string>(StringComparer.Ordinal);
		foreach (var ingredient in extraIngredients.EnumerateArray())
		{
			if (ingredient.ValueKind != JsonValueKind.String
				|| !ingredientNames.Add(ingredient.GetString() ?? string.Empty))
			{
				return false;
			}
		}
	}

	return true;
}

static bool TryReadRecommendationError(JsonElement root, out string requestId, out string code)
{
	requestId = string.Empty;
	code = string.Empty;
	if (!TryReadRequestId(root, out requestId)
		|| !TryReadString(root, "code", out code)
		|| code is not ("busy" or "invalid-request" or "recommendation-failed" or "request-not-found"))
	{
		return false;
	}

	if (!root.TryGetProperty("details", out var details))
	{
		return true;
	}
	if (details.ValueKind != JsonValueKind.Object)
	{
		return false;
	}
	return (!details.TryGetProperty("path", out var path) || path.ValueKind == JsonValueKind.String)
		&& (!details.TryGetProperty("reason", out var reason) || reason.ValueKind == JsonValueKind.String);
}

void ReadResult(JsonElement root, string requestId)
{
	var meals = root.GetProperty("meals");
	if (meals.GetArrayLength() == 0)
	{
		Console.WriteLine($"Request {requestId} returned no valid meal.");
		return;
	}
	var preferred = meals[0];
	Console.WriteLine($"Request {requestId}: preferred {preferred.GetProperty("recipe").GetProperty("name").GetString()} + {preferred.GetProperty("beverage").GetString()}, {meals.GetArrayLength() - 1} candidates.");
}

static string ReadRequestId(JsonElement root) => root.GetProperty("request_id").GetString() ?? "<missing>";

static async Task<string?> ReceiveTextAsync(WebSocket socket, CancellationToken cancellationToken)
{
	var writer = new ArrayBufferWriter<byte>();
	var buffer = new byte[4096];
	while (true)
	{
		var result = await socket.ReceiveAsync(buffer, cancellationToken);
		if (result.MessageType == WebSocketMessageType.Close)
		{
			return null;
		}
		if (result.MessageType != WebSocketMessageType.Text || writer.WrittenCount + result.Count > MaxMessageBytes)
		{
			await CloseAsync(socket, 4005, "invalid-message");
			return null;
		}
		writer.Write(buffer.AsSpan(0, result.Count));
		if (result.EndOfMessage)
		{
			return Encoding.UTF8.GetString(writer.WrittenSpan);
		}
	}
}

static bool HasUniqueJsonMembers(string text)
{
	try
	{
		var reader = new Utf8JsonReader(Encoding.UTF8.GetBytes(text));
		var objectKeys = new Stack<HashSet<string>>();
		while (reader.Read())
		{
			if (reader.TokenType == JsonTokenType.StartObject)
			{
				objectKeys.Push(new HashSet<string>(StringComparer.Ordinal));
			}
			else if (reader.TokenType == JsonTokenType.PropertyName)
			{
				if (objectKeys.Count == 0 || !objectKeys.Peek().Add(reader.GetString() ?? string.Empty))
				{
					return false;
				}
			}
			else if (reader.TokenType == JsonTokenType.EndObject)
			{
				objectKeys.Pop();
			}
		}
		return true;
	}
	catch (JsonException)
	{
		return false;
	}
}

static async Task CloseAsync(WebSocket socket, int code, string reason)
{
	if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
	{
		await socket.CloseAsync((WebSocketCloseStatus)code, reason, CancellationToken.None);
	}
}

static async Task IgnoreCancellationAsync(Task task)
{
	try
	{
		await task;
	}
	catch (OperationCanceledException)
	{
	}
}

static string Base64Url(byte[] bytes) => Convert.ToBase64String(bytes)
	.TrimEnd('=')
	.Replace('+', '-')
	.Replace('/', '_');

sealed class BridgeState
{
	private readonly object sync = new();
	private string? latestPendingToken;
	private string? currentToken;
	private AuthenticatedConnection? current;
	private bool clientUpdateRelaunchClaimed;

	public void SetLatestPendingToken(string token)
	{
		lock (sync)
		{
			latestPendingToken = token;
		}
	}

	public bool CheckToken(string token)
	{
		lock (sync)
		{
			return FixedEquals(token, latestPendingToken) || FixedEquals(token, currentToken);
		}
	}

	public AuthenticatedConnection? Promote(AuthenticatedConnection connection)
	{
		lock (sync)
		{
			if (!CheckToken(connection.Token))
			{
				return null;
			}
			var previous = current;
			current = connection;
			currentToken = connection.Token;
			if (FixedEquals(latestPendingToken, connection.Token))
			{
				latestPendingToken = null;
			}
			return previous;
		}
	}

	public bool IsCurrent(AuthenticatedConnection connection)
	{
		lock (sync)
		{
			return ReferenceEquals(current, connection);
		}
	}

	public void Remove(AuthenticatedConnection connection)
	{
		lock (sync)
		{
			if (ReferenceEquals(current, connection))
			{
				current = null;
			}
		}
	}

	public bool TryClaimClientUpdateRelaunch()
	{
		lock (sync)
		{
			if (clientUpdateRelaunchClaimed)
			{
				return false;
			}
			clientUpdateRelaunchClaimed = true;
			return true;
		}
	}

	public void ClearClientUpdateRelaunch(AuthenticatedConnection connection)
	{
		lock (sync)
		{
			if (ReferenceEquals(current, connection))
			{
				clientUpdateRelaunchClaimed = false;
			}
		}
	}

	private static bool FixedEquals(string? left, string? right)
	{
		if (left is null || right is null)
		{
			return false;
		}
		return CryptographicOperations.FixedTimeEquals(
			Encoding.UTF8.GetBytes(left),
			Encoding.UTF8.GetBytes(right));
	}
}

enum HelloReadResult
{
	InvalidMessage,
	PairingFailed,
	UnsupportedProtocol,
	Valid,
}

sealed class AuthenticatedConnection(WebSocket socket, string token, int maxInFlight)
{
	private readonly System.Collections.Concurrent.ConcurrentDictionary<string, TaskCompletionSource> requests = new();
	private readonly SemaphoreSlim sendLock = new(1, 1);
	private long expectedPong = -1;
	private long acceptedPong = -1;

	public WebSocket Socket { get; } = socket;
	public string Token { get; } = token;
	public int MaxInFlight { get; } = maxInFlight;
	public bool ClientUpdateSeen { get; private set; }

	public async Task TrySendAsync(string text)
	{
		await sendLock.WaitAsync();
		try
		{
			if (Socket.State == WebSocketState.Open)
			{
				await Socket.SendAsync(Encoding.UTF8.GetBytes(text), WebSocketMessageType.Text, true, CancellationToken.None);
			}
		}
		catch (WebSocketException)
		{
		}
		finally
		{
			sendLock.Release();
		}
	}

	public Task TrackRequest(string requestId)
	{
		var completion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
		if (!requests.TryAdd(requestId, completion))
		{
			throw new InvalidOperationException($"Duplicate reference request ID: {requestId}");
		}
		return completion.Task;
	}

	public void CompleteRequest(string requestId)
	{
		if (requests.TryRemove(requestId, out var completion))
		{
			completion.TrySetResult();
		}
	}

	public void ExpectPong(long timestamp) => Interlocked.Exchange(ref expectedPong, timestamp);
	public void AcceptPong(long timestamp)
	{
		if (timestamp == Interlocked.Read(ref expectedPong))
		{
			Interlocked.Exchange(ref acceptedPong, timestamp);
		}
	}
	public bool HasPendingPong() => Interlocked.Read(ref acceptedPong) != Interlocked.Read(ref expectedPong);
	public void MarkClientUpdate() => ClientUpdateSeen = true;
}
