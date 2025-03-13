using MQTTnet;
using ScenarioTestRunner.Objects;
using System.Text.Json;

namespace ScenarioTestRunner.Handlers
{
    public class MQTTConnectionSettings
    {
        public string Topic { get; set; }
        public string ClientId { get; set; }
        public string Address { get; set; }
        public int Port { get; set; }

        public static string AddressAndPort(object setting)
        {
            MQTTConnectionSettings settingParsed = JsonSerializer.Deserialize<MQTTConnectionSettings>(setting.ToString());

            return settingParsed?.Address ?? "" + settingParsed.Port.ToString();
        }
        public static bool CompareSettingsConnectivity(string setting1, string setting2)
        {
            MQTTConnectionSettings setting1Parsed = JsonSerializer.Deserialize<MQTTConnectionSettings>(setting1);
            MQTTConnectionSettings setting2Parsed = JsonSerializer.Deserialize<MQTTConnectionSettings>(setting2);

            return setting1Parsed.Address == setting2Parsed.Address && setting2Parsed.Port == setting1Parsed.Port;
        }
    }

    class MQTTHandler : IHandler
    {
        public string Topic { get; set; }
        public List<Scenario> Scenarios { get; set; }
        public double CurrentValue { get; set; }
        public double DefaultValue { get; set; }
        public double Interval { get; set; }
        public Scenario LoopScenario { get; set; }
        public double CurrentTime { get; set; }
        public int CurrentScenarioIndex { get; set; }
        public Scenario CurrentScenario { get; set; }
        public Func<double, double> MathFunction { get; set; }
        public bool IsInLoopScenario { get; set; }
        public IMqttClient MqttClient;

        private MqttClientOptions options;
        private bool running = true;

        public MQTTHandler(ScenarioConfiguration scenarioConfiguration)
        {
            MQTTConnectionSettings settings = JsonSerializer.Deserialize<MQTTConnectionSettings>(scenarioConfiguration.Settings.ToString());
            Topic = settings.Topic;
            Scenarios = scenarioConfiguration.Scenarios;
            CurrentValue = scenarioConfiguration.DefaultValue;
            DefaultValue = scenarioConfiguration.DefaultValue;
            Interval = scenarioConfiguration.Interval;
            CurrentScenario = scenarioConfiguration.Scenarios.FirstOrDefault(scenario => scenario.T == 0);
            MathFunction = HandlerUtilities.CompileContext(CurrentScenario.Context, this.DefaultValue);
            LoopScenario = scenarioConfiguration.LoopScenario;

            var mqttFactory = new MqttClientFactory();
            this.MqttClient = mqttFactory.CreateMqttClient();
            this.options = new MqttClientOptionsBuilder()
                .WithClientId(settings?.ClientId ?? "ScenarioTestRunner")
                .WithTcpServer(settings?.Address ?? "localhost", settings.Port == 0 ? 1883 : settings.Port)
                .Build();
        }

        public async Task Connect()
        {
            await this.MqttClient.ConnectAsync(this.options, CancellationToken.None);

        }
        public void Connect(IMqttClient mqttClient)
        {
            if (mqttClient != null)
            {
                this.MqttClient = mqttClient;
            }
        }

        public void UpdateFunction(Scenario scenario)
        {
            CurrentScenario = scenario;
            MathFunction = HandlerUtilities.CompileContext(scenario.Context, this.DefaultValue);
            Console.WriteLine($"Updated function for {Topic} to {scenario.Context.Behavior}");
        }

        public void UpdateInterval(int newInterval)
        {
            Interval = newInterval;
            Console.WriteLine($"Updated interval for {Topic} to {Interval} seconds");
        }

        public async Task StartPublishing()
        {

            while (running)
            {
                try
                {
                    this.CheckIfLoopScenario(CurrentValue);
                    if (this.Scenarios.Count > CurrentScenarioIndex + 1 && CurrentTime > this.Scenarios[CurrentScenarioIndex + 1].T)
                    {
                        CurrentScenario = this.Scenarios[CurrentScenarioIndex + 1];
                        MathFunction = HandlerUtilities.CompileContext(CurrentScenario.Context, this.DefaultValue);
                        CurrentScenarioIndex++;
                    }

                    CurrentValue = MathFunction(CurrentValue);
                    var message = new MqttApplicationMessageBuilder()
                        .WithTopic(Topic)
                        .WithPayload(CurrentValue.ToString())
                        .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.ExactlyOnce)
                        .Build();

                    await MqttClient.PublishAsync(message, CancellationToken.None);

                    Console.WriteLine($"Published {CurrentValue} to {Topic} with func '{this.CurrentScenario.Context.Behavior}' and interval '{Interval}' with current time '{CurrentTime}'");
                    CurrentTime += Interval;

                    await Task.Delay(Convert.ToInt32(Interval * 1000));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Exception in StartPublishing: {ex}");
                }
            }
        }

        public void Stop() => running = false;

    }
}

