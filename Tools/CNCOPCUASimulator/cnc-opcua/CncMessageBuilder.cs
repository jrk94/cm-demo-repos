using CNCOPCUASimulator.Objects;
using System.Text.Json;

namespace CNCOPCUASimulator
{
    /// <summary>
    /// Provides methods for constructing JSON messages representing CNC machine telemetry, connection status, and
    /// command results for communication with a remote server.
    /// </summary>
    /// <remarks>This class is intended for internal use to facilitate message formatting and serialization
    /// for CNC machine integration scenarios. It encapsulates machine state and connection information to generate
    /// structured JSON payloads suitable for telemetry and status reporting. Thread safety is not guaranteed; instances
    /// should not be shared across threads without external synchronization.</remarks>
    internal class CncMessageBuilder
    {
        private readonly string _machineId;
        private readonly string _serverEndpoint;
        private readonly CncMachineState _state;

        public CncMessageBuilder(CncMachineState state, string machineId, string serverEndpoint)
        {
            _state = state;
            _serverEndpoint = serverEndpoint;
            _machineId = machineId;
        } 

        public string BuildTelemetryJson()
        {
            var payload = new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                machineId = this._machineId,
                controller = new
                {
                    execution = _state.S("Controller.Execution"),
                    program = _state.S("Controller.Program"),
                    block = _state.S("Controller.Block"),
                    emergencyStop = _state.S("Controller.EmergencyStop"),
                    partCount = _state.I("Controller.PartCount"),
                    cycleTime = _state.F("Controller.CycleTime"),
                },
                spindle = new
                {
                    speed = _state.F("Spindle.Speed"),
                    load = _state.F("Spindle.Load"),
                    @override = _state.F("Spindle.Override"),
                    temperature = _state.F("Spindle.Temperature"),
                    toolNumber = _state.I("Spindle.ToolNumber"),
                },
                axes = new
                {
                    x = new { position = _state.F("Axis.X.Position"), load = _state.F("Axis.X.Load") },
                    y = new { position = _state.F("Axis.Y.Position"), load = _state.F("Axis.Y.Load") },
                    z = new { position = _state.F("Axis.Z.Position"), load = _state.F("Axis.Z.Load") },
                    feedrate = _state.F("Axis.Feedrate"),
                    feedrateOverride = _state.F("Axis.FeedrateOverride"),
                },
                coolant = new
                {
                    flowRate = _state.F("Coolant.FlowRate"),
                    temperature = _state.F("Coolant.Temperature"),
                },
                conditions = new
                {
                    spindle = _state.S("Condition.Spindle"),
                    coolant = _state.S("Condition.Coolant"),
                    axes = _state.S("Condition.Axes"),
                },
                material = new
                {
                    currentPartId = _state.S("Material.CurrentPartId"),
                    workOrderId = _state.S("Material.WorkOrderId"),
                    trackInTime = _state.S("Material.TrackInTime"),
                    trackOutResult = _state.S("Material.TrackOutResult"),
                    trackOutTime = _state.S("Material.TrackOutTime"),
                },
            };

            return JsonSerializer.Serialize(new { type = "telemetry", payload },
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }

        public string BuildConnectionStatusJson(bool connected) =>
            JsonSerializer.Serialize(new
            {
                type = "connection_status",
                payload = new { connected, serverEndpoint = this._serverEndpoint, machineId = this._machineId }
            });

        public static string BuildCommandResultJson(string command, bool success, string message) =>
            JsonSerializer.Serialize(new
            {
                type = "command_result",
                payload = new { command, success, message }
            });
    }
}
