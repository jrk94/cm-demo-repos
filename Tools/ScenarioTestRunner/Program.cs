using MQTTnet;
using ScenarioTestRunner;
using ScenarioTestRunner.Handlers;
using ScenarioTestRunner.Objects;
using System.Collections.Concurrent;
using System.Text.Json;

class Program
{
    static async Task Main(string[] args)
    {
        var configs = Directory.GetFiles(Path.Combine(Directory.GetCurrentDirectory(), "Scenario"), "*.json", SearchOption.AllDirectories);
        string configSelection = "";

        for (int i = 0; i < configs.Length; i++)
        {
            configSelection += $"{i} - {configs[i]}\n";
        }

        Console.WriteLine("Please provide a scenario location (if a folder is selected it will execute all scenarios in the folder):");
        Console.WriteLine(configSelection);
        Console.WriteLine("Or provide your own:");
        string input = Console.ReadLine();

        var handlers = HandleInput(input, configs);

        var handlerDict = new ConcurrentDictionary<string, IHandler>();
        List<Task> tasks = new List<Task>();

        Dictionary<string, object> clientCache = new();

        foreach (var handler in handlers)
        {
            switch (handler.Protocol)
            {
                case Protocol.MQTT:
                    var mqttHandler = new MQTTHandler(handler);

                    if (clientCache.ContainsKey(MQTTConnectionSettings.AddressAndPort(handler.Settings)))
                    {
                        mqttHandler.Connect(clientCache[MQTTConnectionSettings.AddressAndPort(handler.Settings)] as IMqttClient);
                    }
                    else
                    {
                        clientCache.Add(MQTTConnectionSettings.AddressAndPort(handler.Settings), mqttHandler.MqttClient);
                        await mqttHandler.Connect();
                    }

                    handlerDict[handler.Id] = mqttHandler;
                    tasks.Add(mqttHandler.StartPublishing());
                    break;
                case Protocol.RESTClient:

                    handlerDict[handler.Id] = new RESTClientHandler(handler);
                    tasks.Add(handlerDict[handler.Id].StartPublishing());
                    break;
                case Protocol.RESTServer:
                    break;
                case Protocol.SecsGem:
                    break;
                case Protocol.FileRaw:
                    break;
                default:
                    break;
            }
        }

        Task.Run(() => ListenForChanges(handlerDict));
        await Task.WhenAll(tasks);
    }

    static void ListenForChanges(ConcurrentDictionary<string, IHandler> handlers)
    {
        while (true)
        {
            string input = Console.ReadLine();
            var scenarios = JsonSerializer.Deserialize<List<ScenarioConfiguration>>(input);
        }
    }

    private static List<ScenarioConfiguration> HandleInput(string input, string[] defaultValues)
    {
        var handlers = new List<ScenarioConfiguration>();

        var dirRelResolved = Path.Combine(Directory.GetCurrentDirectory(), input);
        var fileResolved = Path.Combine(Directory.GetCurrentDirectory(), input);
        if (Directory.Exists(input) || Directory.Exists(dirRelResolved))
        {
            if (Directory.Exists(dirRelResolved))
            {
                input = dirRelResolved;
            }
            var scenarios = Directory.GetFiles(input);

            foreach (var scenario in scenarios)
            {
                string scenarioConfiguration = File.ReadAllText(scenario);
                handlers.AddRange(JsonSerializer.Deserialize<List<ScenarioConfiguration>>(scenarioConfiguration));
            }
        }
        else if (File.Exists(input) || File.Exists(fileResolved))
        {
            if (File.Exists(fileResolved))
            {
                input = fileResolved;
            }
            string scenarioConfiguration = File.ReadAllText(input);
            handlers.AddRange(JsonSerializer.Deserialize<List<ScenarioConfiguration>>(scenarioConfiguration));
        }
        else
        {
            input = Path.Combine(Directory.GetCurrentDirectory(), defaultValues[int.Parse(input)]);
            string scenarioConfiguration = File.ReadAllText(input);
            handlers.AddRange(JsonSerializer.Deserialize<List<ScenarioConfiguration>>(scenarioConfiguration));
        }
        return handlers;
    }
}
