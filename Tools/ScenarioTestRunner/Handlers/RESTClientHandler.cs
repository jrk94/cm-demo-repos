using ScenarioTestRunner.Handlers;
using ScenarioTestRunner.Objects;
using System.Text;
using System.Text.Json;

namespace ScenarioTestRunner
{
    public class RESTClientConnectionSettings
    {
        public string Address { get; set; }
        public string Endpoint { get; set; }
        public Location DefaultLocation { get; set; }
    }

    public class Location
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    class RESTClientHandler : IHandler
    {
        public string Id { get; set; }
        public string Address { get; set; }
        public string EndPoint { get; set; }
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

        private double Latitude;
        private double Longitude;

        private HttpClient client;
        private bool running = true;

        public RESTClientHandler(ScenarioConfiguration scenarioConfiguration)
        {

            RESTClientConnectionSettings settings = JsonSerializer.Deserialize<RESTClientConnectionSettings>(scenarioConfiguration.Settings.ToString());

            (Latitude, Longitude) = settings.DefaultLocation != null ?
                                        HandlerUtilities.GenerateRandomCoordinate(settings.DefaultLocation.Latitude, settings.DefaultLocation.Longitude, 150) :
                                        HandlerUtilities.DefaultGenerateRandomCoordinates();

            Id = scenarioConfiguration.Id;
            Address = settings.Address;
            EndPoint = settings.Endpoint;
            Scenarios = scenarioConfiguration.Scenarios;
            CurrentValue = scenarioConfiguration.DefaultValue;
            DefaultValue = scenarioConfiguration.DefaultValue;
            Interval = scenarioConfiguration.Interval;
            CurrentScenario = scenarioConfiguration.Scenarios.FirstOrDefault(scenario => scenario.T == 0);
            MathFunction = HandlerUtilities.CompileContext(CurrentScenario.Context, this.DefaultValue);
            LoopScenario = scenarioConfiguration.LoopScenario;

            this.client = new HttpClient
            {
                BaseAddress = new Uri(settings.Address),
                Timeout = TimeSpan.FromSeconds(100)
            };
            this.client.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public void UpdateFunction(Scenario scenario)
        {
            CurrentScenario = scenario;
            MathFunction = HandlerUtilities.CompileContext(scenario.Context, this.DefaultValue);
            Console.WriteLine($"Updated function for {Address} to {scenario.Context.Behavior}");
        }

        public void UpdateInterval(int newInterval)
        {
            Interval = newInterval;
            Console.WriteLine($"Updated interval for {Address} to {Interval} seconds");
        }

        public async Task StartPublishing()
        {
            while (running)
            {
                this.CheckIfLoopScenario(CurrentValue);
                if (this.Scenarios.Count > CurrentScenarioIndex + 1 && CurrentTime > this.Scenarios[CurrentScenarioIndex + 1].T)
                {
                    CurrentScenario = this.Scenarios[CurrentScenarioIndex + 1];
                    MathFunction = HandlerUtilities.CompileContext(CurrentScenario.Context, this.DefaultValue);
                    CurrentScenarioIndex++;
                }

                CurrentValue = MathFunction(CurrentValue);

                var postValue = GenerateAirQualityJson(CurrentValue, this.Id, Latitude, Longitude);
                var content = new StringContent(postValue, Encoding.UTF8, "application/json");

                try
                {
                    var response = await client.PostAsync(this.EndPoint, content);
                    response.EnsureSuccessStatusCode();
                    var responseContent = await response.Content.ReadAsStringAsync();

                    Console.WriteLine($"Published {postValue} to {Address} with endpoint {EndPoint} with func '{this.CurrentScenario.Context.Behavior}' and interval '{Interval}' with current time '{CurrentTime}'");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to publish {CurrentValue} to {Address} with endpoint {EndPoint} with func '{this.CurrentScenario.Context.Behavior}' and interval '{Interval}' with current time '{CurrentTime}'");
                }
                CurrentTime += Interval;
                await Task.Delay(Convert.ToInt32(Interval * 1000));
            }
        }

        public void Stop() => running = false;

        private static string GenerateAirQualityJson(
            double currentValue,
            string deviceId,
            double latitude,
            double longitude)
        {
            var (pm25, co2, voc) = ExtrapolateAirQuality(currentValue);
            var airQualityData = new
            {
                device_id = deviceId,
                location = new
                {
                    latitude,
                    longitude
                },
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                readings = new
                {
                    pm2_5 = pm25,
                    pm10 = currentValue,
                    co2,
                    voc
                },
                status = "ok"
            };

            return JsonSerializer.Serialize(airQualityData);
        }

        private static (double pm25, double co2, double voc) ExtrapolateAirQuality(double pm10)
        {
            Random random = new Random();

            // PM2.5 is typically 60-75% of PM10
            double pm25 = pm10 * (0.6 + random.NextDouble() * 0.15);

            // CO2 levels loosely correlated with pollution and human activity
            // Normal outdoor CO2 is ~400 ppm, but urban areas can be higher.
            double co2 = 380 + (pm10 * (0.5 + random.NextDouble() * 1.0));

            // VOC levels are more unpredictable but roughly scale with PM10 and CO2
            double voc = 0.2 + (pm10 * (0.01 + random.NextDouble() * 0.02));

            return (pm25, co2, voc);
        }
    }

}
