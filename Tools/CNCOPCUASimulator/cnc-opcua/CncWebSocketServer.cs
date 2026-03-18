using System.Collections.Concurrent;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace CNCOPCUASimulator
{
    internal class CncWebSocketServer
    {
        public const string WsUrl = "http://localhost:5000/";

        private readonly ConcurrentDictionary<Guid, WebSocket> _clients = new();
        private readonly CncMessageBuilder _messageBuilder;
        private readonly SemaphoreSlim _startSignal;

        public CancellationTokenSource? CycleCts { get; set; }

        public CncWebSocketServer(CncMessageBuilder messageBuilder, SemaphoreSlim startSignal)
        {
            _messageBuilder = messageBuilder;
            _startSignal = startSignal;
        }

        public async Task RunAsync(CancellationToken ct)
        {
            var listener = new HttpListener();
            listener.Prefixes.Add(WsUrl);
            try { listener.Start(); }
            catch (Exception ex)
            {
                Console.WriteLine($"[WS] Failed to start listener: {ex.Message}");
                return;
            }

            Console.WriteLine($"[WS] Listening on {WsUrl}");

            while (!ct.IsCancellationRequested)
            {
                HttpListenerContext ctx;
                try { ctx = await listener.GetContextAsync(); }
                catch { break; }

                if (ctx.Request.IsWebSocketRequest)
                    _ = HandleWebSocketClientAsync(ctx, ct);
                else
                    HandleHttpRequest(ctx);
            }

            listener.Stop();
        }

        public async Task BroadcastAsync()
        {
            var json = _messageBuilder.BuildTelemetryJson();
            foreach (var (id, ws) in _clients)
            {
                try { await SendToAsync(ws, json); }
                catch { _clients.TryRemove(id, out _); }
            }
        }

        private async Task HandleWebSocketClientAsync(HttpListenerContext ctx, CancellationToken ct)
        {
            var wsCtx = await ctx.AcceptWebSocketAsync(subProtocol: null);
            var ws = wsCtx.WebSocket;
            var id = Guid.NewGuid();
            _clients[id] = ws;

            Console.WriteLine($"[WS] Client connected ({id})");

            await SendToAsync(ws, _messageBuilder.BuildTelemetryJson());
            await SendToAsync(ws, _messageBuilder.BuildConnectionStatusJson(connected: true));

            var buf = new byte[1024];
            try
            {
                while (ws.State == WebSocketState.Open && !ct.IsCancellationRequested)
                {
                    var result = await ws.ReceiveAsync(buf, ct);
                    if (result.MessageType == WebSocketMessageType.Close) break;

                    var msg = JsonDocument.Parse(buf[..result.Count]);
                    var type = msg.RootElement.GetProperty("type").GetString();

                    switch (type)
                    {
                        case "start":
                            if (CycleCts == null || CycleCts.IsCancellationRequested)
                            {
                                if (_startSignal.CurrentCount == 0) _startSignal.Release();
                                await SendToAsync(ws, CncMessageBuilder.BuildCommandResultJson("start", true, "Cycle started"));
                            }
                            else
                            {
                                await SendToAsync(ws, CncMessageBuilder.BuildCommandResultJson("start", false, "Already running"));
                            }
                            break;

                        case "stop":
                            CycleCts?.Cancel();
                            await SendToAsync(ws, CncMessageBuilder.BuildCommandResultJson("stop", true, "Cycle stopped"));
                            break;

                        case "get_telemetry":
                            await SendToAsync(ws, _messageBuilder.BuildTelemetryJson());
                            break;
                    }
                }
            }
            catch (OperationCanceledException) { /* shutdown */ }
            catch (Exception ex) { Console.WriteLine($"[WS] Client error: {ex.Message}"); }
            finally
            {
                _clients.TryRemove(id, out _);
                Console.WriteLine($"[WS] Client disconnected ({id})");
                try { await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None); } catch { }
            }
        }

        private void HandleHttpRequest(HttpListenerContext ctx)
        {
            ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            ctx.Response.ContentType = "application/json";

            var path = ctx.Request.Url?.AbsolutePath.TrimEnd('/');
            string body = path switch
            {
                "/health" => $"{{\"status\":\"ok\",\"clients\":{_clients.Count}}}",
                "/status" => $"{{\"running\":{(CycleCts != null && !CycleCts.IsCancellationRequested).ToString().ToLower()}}}",
                _ => "{\"error\":\"not found\"}"
            };

            ctx.Response.StatusCode = path is "/health" or "/status" ? 200 : 404;
            var bytes = Encoding.UTF8.GetBytes(body);
            ctx.Response.OutputStream.Write(bytes);
            ctx.Response.Close();
        }

        private static async Task SendToAsync(WebSocket ws, string json)
        {
            if (ws.State != WebSocketState.Open) return;
            var bytes = new ArraySegment<byte>(Encoding.UTF8.GetBytes(json));
            await ws.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, CancellationToken.None);
        }
    }
}
