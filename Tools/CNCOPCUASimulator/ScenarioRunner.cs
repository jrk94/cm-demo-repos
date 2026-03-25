using IoTTestOrchestrator.OPCUA.Helpers.OpcTagModel;
using IoTTestOrchestrator.ScenarioBuilder;
using IoTTestOrchestrator.ScenarioBuilder.Implementations.Configuration;
using System.Collections.Concurrent;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OPCUASimulator
{
    /// <summary>
    /// Simulates a CNC Machining Center exposing data via OPC-UA.
    /// Also hosts a WebSocket server on port 5000 so the UI receives live
    /// tag updates the moment WriteTag() is called — no bridge needed.
    ///
    /// UI connects to:  ws://localhost:5000/
    /// UI sends:        {"type":"start"} | {"type":"stop"}
    /// Server pushes:   {"type":"telemetry","payload":{...}}
    ///                  {"type":"command_result","payload":{...}}
    /// </summary>
    public class ScenarioRunner
    {
        private TestScenario _scenario;
        private CancellationTokenSource _cts;
        private CancellationTokenSource _cycleCts;
        private readonly SemaphoreSlim _startSignal = new(0, 1);

        private const string OpcUaServer = "opc.tcp://localhost:4840";
        private const string MachineId   = "CNC_007";
        private const string WsUrl       = "http://localhost:5000/";

        // ── in-memory tag state (mirrors OPC-UA node values) ──────────────────
        private readonly Dictionary<string, object> _state = new()
        {
            ["Controller.Execution"]      = "READY",
            ["Controller.Program"]        = "O1001_BRACKET_AL6061",
            ["Controller.Block"]          = "N0000",
            ["Controller.EmergencyStop"]  = "ARMED",
            ["Controller.PartCount"]      = 0,
            ["Controller.CycleTime"]      = 0.0f,
            ["Spindle.Speed"]             = 0.0f,
            ["Spindle.Load"]              = 0.0f,
            ["Spindle.Override"]          = 100.0f,
            ["Spindle.Temperature"]       = 22.0f,
            ["Spindle.ToolNumber"]        = 0,
            ["Axis.X.Position"]           = 0.0f,
            ["Axis.X.Load"]               = 0.0f,
            ["Axis.Y.Position"]           = 0.0f,
            ["Axis.Y.Load"]               = 0.0f,
            ["Axis.Z.Position"]           = 0.0f,
            ["Axis.Z.Load"]               = 0.0f,
            ["Axis.Feedrate"]             = 0.0f,
            ["Axis.FeedrateOverride"]     = 100.0f,
            ["Coolant.FlowRate"]          = 0.0f,
            ["Coolant.Temperature"]       = 20.0f,
            ["Condition.Spindle"]         = "NORMAL",
            ["Condition.Coolant"]         = "NORMAL",
            ["Condition.Axes"]            = "NORMAL",
            ["Material.CurrentPartId"]    = "",
            ["Material.WorkOrderId"]      = "",
            ["Material.TrackInTime"]      = "",
            ["Material.TrackOutResult"]   = "",
            ["Material.TrackOutTime"]     = "",
        };

        // ── connected WebSocket clients ────────────────────────────────────────
        private readonly ConcurrentDictionary<Guid, WebSocket> _clients = new();

        // ── simulated state ────────────────────────────────────────────────────
        private int    _partCounter       = 441;
        private string _currentWorkOrder  = "WO-8821";

        // ══════════════════════════════════════════════════════════════════════
        // Entry point
        // ══════════════════════════════════════════════════════════════════════
        public async Task RunAsync()
        {
            _cts = new CancellationTokenSource();

            Console.WriteLine("CNC Simulator — MTConnect/CESMII Profile");
            Console.WriteLine($"WebSocket UI server : {WsUrl}");
            Console.WriteLine($"OPC-UA server       : {OpcUaServer}");
            Console.WriteLine("Press 'q' to quit");

            // Quit on 'q' key press
            _ = Task.Run(() =>
            {
                while (true)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar is 'q' or 'Q')
                    {
                        Console.WriteLine("\nShutdown initiated…");
                        _cts.Cancel();
                        break;
                    }
                }
            });

            // ── build OPC-UA scenario ──────────────────────────────────────────
            var managerName = "test";
            var scenario = new ScenarioConfiguration()
                .WriteLogsTo("c:/temp/CNC-Simulator.log")
                .ManagerId(managerName)
                .ConfigPath("C:/Users/jroque/Downloads/roque/config.downloaded.json")
                .AddSimulatorPlugin<IoTTestOrchestrator.OPCUA.PluginMain>(
                    new IoTTestOrchestrator.OPCUA.Plugin.SettingsBuilder()
                        .Address(OpcUaServer)
                        .AddTag(new OpcTag { Name = "Controller.Execution",     NodeId = "ns=2;s=cnc007.controller.execution",     AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("READY"),                  Type = "String"  })
                        .AddTag(new OpcTag { Name = "Controller.Program",       NodeId = "ns=2;s=cnc007.controller.program",       AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("O1001_BRACKET_AL6061"),  Type = "String"  })
                        .AddTag(new OpcTag { Name = "Controller.Block",         NodeId = "ns=2;s=cnc007.controller.block",         AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("N0000"),                  Type = "String"  })
                        .AddTag(new OpcTag { Name = "Controller.EmergencyStop", NodeId = "ns=2;s=cnc007.controller.emergencyStop", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("ARMED"),                  Type = "String"  })
                        .AddTag(new OpcTag { Name = "Controller.PartCount",     NodeId = "ns=2;s=cnc007.controller.partCount",     AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0),                       Type = "Int32"   })
                        .AddTag(new OpcTag { Name = "Controller.CycleTime",     NodeId = "ns=2;s=cnc007.controller.cycleTime",     AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Spindle.Speed",            NodeId = "ns=2;s=cnc007.spindle.speed",            AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Spindle.Load",             NodeId = "ns=2;s=cnc007.spindle.load",             AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Spindle.Override",         NodeId = "ns=2;s=cnc007.spindle.override",         AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(100.0),                   Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Spindle.Temperature",      NodeId = "ns=2;s=cnc007.spindle.temperature",      AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(22.0),                    Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Spindle.ToolNumber",       NodeId = "ns=2;s=cnc007.spindle.toolNumber",       AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0),                       Type = "Int32"   })
                        .AddTag(new OpcTag { Name = "Axis.X.Position",          NodeId = "ns=2;s=cnc007.axis.x.position",          AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Axis.X.Load",              NodeId = "ns=2;s=cnc007.axis.x.load",              AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Axis.Y.Position",          NodeId = "ns=2;s=cnc007.axis.y.position",          AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Axis.Y.Load",              NodeId = "ns=2;s=cnc007.axis.y.load",              AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Axis.Z.Position",          NodeId = "ns=2;s=cnc007.axis.z.position",          AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Axis.Z.Load",              NodeId = "ns=2;s=cnc007.axis.z.load",              AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Axis.Feedrate",            NodeId = "ns=2;s=cnc007.axis.feedrate",            AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Axis.FeedrateOverride",    NodeId = "ns=2;s=cnc007.axis.feedrateOverride",    AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(100.0),                   Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Coolant.FlowRate",         NodeId = "ns=2;s=cnc007.coolant.flowRate",         AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0),                     Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Coolant.Temperature",      NodeId = "ns=2;s=cnc007.coolant.temperature",      AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(20.0),                    Type = "Float"   })
                        .AddTag(new OpcTag { Name = "Condition.Spindle",        NodeId = "ns=2;s=cnc007.condition.spindle",        AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("NORMAL"),                 Type = "String"  })
                        .AddTag(new OpcTag { Name = "Condition.Coolant",        NodeId = "ns=2;s=cnc007.condition.coolant",        AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("NORMAL"),                 Type = "String"  })
                        .AddTag(new OpcTag { Name = "Condition.Axes",           NodeId = "ns=2;s=cnc007.condition.axes",           AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("NORMAL"),                 Type = "String"  })
                        .AddTag(new OpcTag { Name = "Material.CurrentPartId",   NodeId = "ns=2;s=cnc007.material.currentPartId",   AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""),                       Type = "String"  })
                        .AddTag(new OpcTag { Name = "Material.WorkOrderId",     NodeId = "ns=2;s=cnc007.material.workOrderId",     AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""),                       Type = "String"  })
                        .AddTag(new OpcTag { Name = "Material.TrackInTime",     NodeId = "ns=2;s=cnc007.material.trackInTime",     AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""),                       Type = "String"  })
                        .AddTag(new OpcTag { Name = "Material.TrackOutResult",  NodeId = "ns=2;s=cnc007.material.trackOutResult",  AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""),                       Type = "String"  })
                        .AddTag(new OpcTag { Name = "Material.TrackOutTime",    NodeId = "ns=2;s=cnc007.material.trackOutTime",    AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""),                       Type = "String"  })
                        .Build());

            _scenario = new TestScenario(scenario);
            var context = _scenario.Context();
            var opc = context.Simulators["OPCUA"] as IoTTestOrchestrator.OPCUA.PluginMain;

            try
            {
                _scenario.Start();
                _scenario.StartSimulators();

                Console.WriteLine($"[{MachineId}] OPC-UA server running at {OpcUaServer}");

                Thread.Sleep(5000); // let the OPC-UA server initialise

                // Start WebSocket server — runs the entire lifetime of the app
                _ = RunWebSocketServerAsync(_cts.Token);

                // Main loop: wait for Start from UI → run cycles → wait again
                while (!_cts.IsCancellationRequested)
                {
                    Console.WriteLine($"[{MachineId}] Waiting for Start command from UI…");
                    await _startSignal.WaitAsync(_cts.Token);

                    _cycleCts = new CancellationTokenSource();
                    Console.WriteLine($"[{MachineId}] Cycle loop started");

                    try
                    {
                        await RunCncCycleSimulationAsync(opc, _cycleCts.Token);
                    }
                    catch (OperationCanceledException)
                    {
                        Console.WriteLine($"[{MachineId}] Cycle interrupted by Stop command");
                    }

                    // Reset machine to idle
                    WriteTag(opc, "Controller.Execution",  "READY");
                    WriteTag(opc, "Spindle.Speed",         0.0f);
                    WriteTag(opc, "Spindle.Load",          0.0f);
                    WriteTag(opc, "Axis.Feedrate",         0.0f);
                    WriteTag(opc, "Coolant.FlowRate",      0.0f);
                    await BroadcastAsync();

                    Console.WriteLine($"[{MachineId}] Idle — waiting for next Start…");
                }
            }
            catch (OperationCanceledException) { /* normal shutdown */ }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
            finally
            {
                _scenario.ShutdownSimulators();
                _scenario.Shutdown();
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // WriteTag wrapper — updates local state + OPC-UA node
        // ══════════════════════════════════════════════════════════════════════
        private void WriteTag(IoTTestOrchestrator.OPCUA.PluginMain opc, string name, object value)
        {
            opc.WriteTag(name, value);
            _state[name] = value;
        }

        // ══════════════════════════════════════════════════════════════════════
        // WebSocket server
        // ══════════════════════════════════════════════════════════════════════
        private async Task RunWebSocketServerAsync(CancellationToken ct)
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

        private async Task HandleWebSocketClientAsync(HttpListenerContext ctx, CancellationToken ct)
        {
            var wsCtx = await ctx.AcceptWebSocketAsync(subProtocol: null);
            var ws    = wsCtx.WebSocket;
            var id    = Guid.NewGuid();
            _clients[id] = ws;

            Console.WriteLine($"[WS] Client connected ({id})");

            // Send initial state snapshot
            await SendToAsync(ws, BuildTelemetryJson());
            await SendToAsync(ws, BuildConnectionStatusJson(connected: true));

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
                            if (_cycleCts == null || _cycleCts.IsCancellationRequested)
                            {
                                if (_startSignal.CurrentCount == 0) _startSignal.Release();
                                await SendToAsync(ws, BuildCommandResultJson("start", true, "Cycle started"));
                            }
                            else
                            {
                                await SendToAsync(ws, BuildCommandResultJson("start", false, "Already running"));
                            }
                            break;

                        case "stop":
                            _cycleCts?.Cancel();
                            await SendToAsync(ws, BuildCommandResultJson("stop", true, "Cycle stopped"));
                            break;

                        case "get_telemetry":
                            await SendToAsync(ws, BuildTelemetryJson());
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

        // Simple REST fallback (health + status), same port
        private void HandleHttpRequest(HttpListenerContext ctx)
        {
            ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            ctx.Response.ContentType = "application/json";

            var path = ctx.Request.Url?.AbsolutePath.TrimEnd('/');
            string body = path switch
            {
                "/health" => $"{{\"status\":\"ok\",\"clients\":{_clients.Count}}}",
                "/status" => $"{{\"running\":{(_cycleCts != null && !_cycleCts.IsCancellationRequested).ToString().ToLower()}}}",
                _ => "{\"error\":\"not found\"}"
            };

            ctx.Response.StatusCode = path is "/health" or "/status" ? 200 : 404;
            var bytes = Encoding.UTF8.GetBytes(body);
            ctx.Response.OutputStream.Write(bytes);
            ctx.Response.Close();
        }

        // ══════════════════════════════════════════════════════════════════════
        // Broadcast helpers
        // ══════════════════════════════════════════════════════════════════════
        private async Task BroadcastAsync()
        {
            var json = BuildTelemetryJson();
            foreach (var (id, ws) in _clients)
            {
                try { await SendToAsync(ws, json); }
                catch { _clients.TryRemove(id, out _); }
            }
        }

        private static async Task SendToAsync(WebSocket ws, string json)
        {
            if (ws.State != WebSocketState.Open) return;
            var bytes = new ArraySegment<byte>(Encoding.UTF8.GetBytes(json));
            await ws.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, CancellationToken.None);
        }

        // ══════════════════════════════════════════════════════════════════════
        // JSON builders — matches the CncTelemetry interface in Angular
        // ══════════════════════════════════════════════════════════════════════
        private string BuildTelemetryJson()
        {
            var payload = new
            {
                timestamp  = DateTime.UtcNow.ToString("O"),
                machineId  = MachineId,
                controller = new
                {
                    execution    = S("Controller.Execution"),
                    program      = S("Controller.Program"),
                    block        = S("Controller.Block"),
                    emergencyStop= S("Controller.EmergencyStop"),
                    partCount    = I("Controller.PartCount"),
                    cycleTime    = F("Controller.CycleTime"),
                },
                spindle = new
                {
                    speed       = F("Spindle.Speed"),
                    load        = F("Spindle.Load"),
                    @override   = F("Spindle.Override"),
                    temperature = F("Spindle.Temperature"),
                    toolNumber  = I("Spindle.ToolNumber"),
                },
                axes = new
                {
                    x = new { position = F("Axis.X.Position"), load = F("Axis.X.Load") },
                    y = new { position = F("Axis.Y.Position"), load = F("Axis.Y.Load") },
                    z = new { position = F("Axis.Z.Position"), load = F("Axis.Z.Load") },
                    feedrate         = F("Axis.Feedrate"),
                    feedrateOverride = F("Axis.FeedrateOverride"),
                },
                coolant = new
                {
                    flowRate    = F("Coolant.FlowRate"),
                    temperature = F("Coolant.Temperature"),
                },
                conditions = new
                {
                    spindle = S("Condition.Spindle"),
                    coolant = S("Condition.Coolant"),
                    axes    = S("Condition.Axes"),
                },
                material = new
                {
                    currentPartId  = S("Material.CurrentPartId"),
                    workOrderId    = S("Material.WorkOrderId"),
                    trackInTime    = S("Material.TrackInTime"),
                    trackOutResult = S("Material.TrackOutResult"),
                    trackOutTime   = S("Material.TrackOutTime"),
                },
            };

            return JsonSerializer.Serialize(new { type = "telemetry", payload },
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }

        private static string BuildConnectionStatusJson(bool connected) =>
            JsonSerializer.Serialize(new
            {
                type    = "connection_status",
                payload = new { connected, serverEndpoint = "opc.tcp://localhost:4840", machineId = MachineId }
            });

        private static string BuildCommandResultJson(string command, bool success, string message) =>
            JsonSerializer.Serialize(new
            {
                type    = "command_result",
                payload = new { command, success, message }
            });

        // State accessors
        private string S(string key) => _state.TryGetValue(key, out var v) ? v?.ToString() ?? "" : "";
        private float  F(string key) => _state.TryGetValue(key, out var v) ? Convert.ToSingle(v) : 0f;
        private int    I(string key) => _state.TryGetValue(key, out var v) ? Convert.ToInt32(v)  : 0;

        // ══════════════════════════════════════════════════════════════════════
        // CNC cycle simulation
        // ══════════════════════════════════════════════════════════════════════
        private async Task RunCncCycleSimulationAsync(IoTTestOrchestrator.OPCUA.PluginMain opc, CancellationToken ct)
        {
            var rng        = new Random();
            int totalParts = 0;

            while (!ct.IsCancellationRequested)
            {
                string partId        = $"BRK-2026-{_partCounter++:D4}";
                string trackInTime   = DateTime.UtcNow.ToString("HH:mm:ss");
                bool coolantFault    = rng.NextDouble() < 0.15;
                bool spindleWarning  = rng.NextDouble() < 0.10;

                // ── TRACK IN ──────────────────────────────────────────────────
                Console.WriteLine($"\n[{DateTime.UtcNow:HH:mm:ss}] TRACK_IN  part={partId} order={_currentWorkOrder}");
                WriteTag(opc, "Material.CurrentPartId",  partId);
                WriteTag(opc, "Material.WorkOrderId",    _currentWorkOrder);
                WriteTag(opc, "Material.TrackInTime",    trackInTime);
                WriteTag(opc, "Material.TrackOutResult", "");
                WriteTag(opc, "Material.TrackOutTime",   "");
                await BroadcastAsync();

                // ── CYCLE START ───────────────────────────────────────────────
                WriteTag(opc, "Controller.Execution", "ACTIVE");
                WriteTag(opc, "Controller.Program",   "O1001_BRACKET_AL6061");
                WriteTag(opc, "Controller.Block",     "N0010");
                WriteTag(opc, "Spindle.ToolNumber",   4);
                WriteTag(opc, "Spindle.Speed",        8200.0f);
                WriteTag(opc, "Spindle.Load",         12.0f);
                WriteTag(opc, "Axis.Feedrate",        500.0f);
                WriteTag(opc, "Coolant.FlowRate",     8.5f);
                await BroadcastAsync();

                Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CYCLE_START tool=T04 speed=8200rpm feed=500mm/min");

                var  cycleStart       = DateTime.UtcNow;
                bool cycleInterrupted = false;

                for (int tick = 0; tick < 9 && !ct.IsCancellationRequested; tick++)
                {
                    await Task.Delay(6000, ct);

                    WriteTag(opc, "Spindle.Temperature", (float)Math.Round(22.0 + tick * 0.8 + rng.NextDouble() * 0.4, 1));
                    WriteTag(opc, "Spindle.Load",        (float)Math.Round(spindleWarning && tick == 4 ? 82.0 : 10.0 + rng.NextDouble() * 8.0, 1));
                    WriteTag(opc, "Axis.X.Position",     (float)Math.Round(rng.NextDouble() * 300.0,             3));
                    WriteTag(opc, "Axis.Y.Position",     (float)Math.Round(rng.NextDouble() * 200.0,             3));
                    WriteTag(opc, "Axis.Z.Position",     (float)Math.Round(-20.0 - rng.NextDouble() * 60.0,      3));
                    WriteTag(opc, "Axis.X.Load",         (float)Math.Round(5.0  + rng.NextDouble() * 10.0, 1));
                    WriteTag(opc, "Axis.Y.Load",         (float)Math.Round(5.0  + rng.NextDouble() * 10.0, 1));
                    WriteTag(opc, "Axis.Z.Load",         (float)Math.Round(8.0  + rng.NextDouble() * 15.0, 1));
                    WriteTag(opc, "Controller.Block",    $"N{(tick + 1) * 10:D4}");

                    if (spindleWarning && tick == 4)
                    {
                        WriteTag(opc, "Condition.Spindle", "WARNING");
                        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CONDITION spindle=WARNING load=82%");
                    }

                    if (coolantFault && tick == 6)
                    {
                        WriteTag(opc, "Condition.Coolant",    "FAULT");
                        WriteTag(opc, "Coolant.FlowRate",     1.2f);
                        WriteTag(opc, "Controller.Execution", "INTERRUPTED");
                        cycleInterrupted = true;
                        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CONDITION coolant=FAULT flow=1.2L/min");
                    }

                    await BroadcastAsync();

                    if (cycleInterrupted) break;
                }

                float cycleTime = (float)Math.Round((DateTime.UtcNow - cycleStart).TotalSeconds * 10, 1);
                string trackOutResult;

                if (cycleInterrupted)
                {
                    trackOutResult = "SCRAPPED";
                    WriteTag(opc, "Material.TrackOutResult", trackOutResult);
                    WriteTag(opc, "Material.TrackOutTime",   DateTime.UtcNow.ToString("HH:mm:ss"));
                    await BroadcastAsync();

                    await Task.Delay(2000, ct);

                    WriteTag(opc, "Condition.Coolant",    "NORMAL");
                    WriteTag(opc, "Coolant.FlowRate",     8.5f);
                    WriteTag(opc, "Controller.Execution", "READY");
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] TRACK_OUT part={partId} result=SCRAPPED");
                }
                else
                {
                    trackOutResult = "PASS";
                    totalParts++;
                    WriteTag(opc, "Condition.Spindle",        "NORMAL");
                    WriteTag(opc, "Controller.Execution",     "PROGRAM_COMPLETED");
                    WriteTag(opc, "Controller.Block",         "N9999");
                    WriteTag(opc, "Controller.CycleTime",     cycleTime);
                    WriteTag(opc, "Controller.PartCount",     totalParts);
                    WriteTag(opc, "Spindle.Speed",            0.0f);
                    WriteTag(opc, "Spindle.Load",             0.0f);
                    WriteTag(opc, "Axis.Feedrate",            0.0f);
                    WriteTag(opc, "Coolant.FlowRate",         0.0f);
                    WriteTag(opc, "Material.TrackOutResult",  trackOutResult);
                    WriteTag(opc, "Material.TrackOutTime",    DateTime.UtcNow.ToString("HH:mm:ss"));
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CYCLE_COMPLETE cycleTime={cycleTime}s");
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] TRACK_OUT part={partId} result=PASS");
                }

                await BroadcastAsync();

                WriteTag(opc, "Controller.Execution", "READY");
                await BroadcastAsync();
                await Task.Delay(1500, ct);
            }
        }
    }

    public enum CncExecutionState { Ready, Active, Interrupted, FeedHold, Stopped, ProgramCompleted }
}
