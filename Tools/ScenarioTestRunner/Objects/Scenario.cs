namespace ScenarioTestRunner.Objects
{
    public class Scenario
    {
        public int T { get; set; }
        public Context Context { get; set; }
    }
    public class Context
    {
        public string Behavior { get; set; }
        public double Setpoint { get; set; }
        public object Settings { get; set; }
    }
}