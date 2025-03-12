using System.Text.Json.Serialization;

namespace ScenarioTestRunner.Objects
{
    public class ScenarioConfiguration
    {
        public string Id { get; set; }
        public object Settings { get; set; }
        public List<Scenario> Scenarios { get; set; }
        public double DefaultValue { get; set; }
        public double Interval { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public Protocol Protocol { get; set; }
        public Scenario LoopScenario { get; set; }
    }

    public enum Protocol
    {
        MQTT,
        RESTClient,
        RESTServer,
        SecsGem,
        FileRaw
    }
}
