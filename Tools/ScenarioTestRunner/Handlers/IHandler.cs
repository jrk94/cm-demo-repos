using ScenarioTestRunner.Objects;

namespace ScenarioTestRunner.Handlers
{
    public interface IHandler
    {
        void UpdateFunction(Scenario scenario);

        void UpdateInterval(int newInterval);

        Task StartPublishing();

        void Stop();

        List<Scenario> Scenarios { get; set; }
        double CurrentValue { get; set; }
        double DefaultValue { get; set; }
        double Interval { get; set; }
        Scenario LoopScenario { get; set; }
        double CurrentTime { get; set; }
        int CurrentScenarioIndex { get; set; }
        Scenario CurrentScenario { get; set; }
        Func<double, double> MathFunction { get; set; }
        bool IsInLoopScenario { get; set; }
    }
}
