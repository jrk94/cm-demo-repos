namespace CNCOPCUASimulator.Objects
{
    /// <summary>
    /// Represents the current state of a CNC machine, including controller, spindle, axis, coolant, and material
    /// information.
    /// </summary>
    /// <remarks>This class provides access to various machine state parameters through key-based lookup
    /// methods. It is intended for internal use to facilitate state tracking and tag writing operations within CNC
    /// machine orchestration scenarios.</remarks>
    internal class CncMachineState
    {
        private readonly Dictionary<string, object> _state = new()
        {
            ["Controller.Execution"] = "READY",
            ["Controller.Program"] = "O1001_BRACKET_AL6061",
            ["Controller.Block"] = "N0000",
            ["Controller.EmergencyStop"] = "ARMED",
            ["Controller.PartCount"] = 0,
            ["Controller.CycleTime"] = 0.0f,
            ["Spindle.Speed"] = 0.0f,
            ["Spindle.Load"] = 0.0f,
            ["Spindle.Override"] = 100.0f,
            ["Spindle.Temperature"] = 22.0f,
            ["Spindle.ToolNumber"] = 0,
            ["Axis.X.Position"] = 0.0f,
            ["Axis.X.Load"] = 0.0f,
            ["Axis.Y.Position"] = 0.0f,
            ["Axis.Y.Load"] = 0.0f,
            ["Axis.Z.Position"] = 0.0f,
            ["Axis.Z.Load"] = 0.0f,
            ["Axis.Feedrate"] = 0.0f,
            ["Axis.FeedrateOverride"] = 100.0f,
            ["Coolant.FlowRate"] = 0.0f,
            ["Coolant.Temperature"] = 20.0f,
            ["Condition.Spindle"] = "NORMAL",
            ["Condition.Coolant"] = "NORMAL",
            ["Condition.Axes"] = "NORMAL",
            ["Material.CurrentPartId"] = "",
            ["Material.WorkOrderId"] = "",
            ["Material.TrackInTime"] = "",
            ["Material.TrackOutResult"] = "",
            ["Material.TrackOutTime"] = "",
        };

        public void WriteTag(IoTTestOrchestrator.OPCUA.PluginMain opc, string name, object value)
        {
            opc.WriteTag(name, value);
            _state[name] = value;
        }

        public string S(string key) => _state.TryGetValue(key, out var v) ? v?.ToString() ?? "" : "";
        public float F(string key) => _state.TryGetValue(key, out var v) ? Convert.ToSingle(v) : 0f;
        public int I(string key) => _state.TryGetValue(key, out var v) ? Convert.ToInt32(v) : 0;
    }
}
