using Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.ResourceManagement.InputObjects;

namespace AlarmGenerator
{
    public partial class ScenarioRunner
    {
        private CancellationTokenSource cts;
        private static readonly SemaphoreSlim _trigger = new SemaphoreSlim(0);
        private static readonly object _trackLock = new object();
        private static readonly Random _random = new Random();

        private record AlarmDefinition(string Code, string Type, string Severity, string Description, string Cause);
        private record AlarmScenario(string Name, AlarmDefinition[] Alarms);

        private static readonly AlarmScenario[] AlarmScenarios =
        [
            new("MotorOverheat",
            [
                new("LubricationFaultAlarm",   "Equipment", "Medium",   "Lubrication system flow rate insufficient",              "Blocked lubrication line or low oil level"),
                new("MotorOverheatAlarm",       "Equipment", "Critical", "Motor temperature exceeded safe threshold",              "Prolonged operation above rated load"),
                new("EmergencyStopAlarm",       "Safety",    "Critical", "Emergency stop activated due to motor overheat",         "Automatic safety shutdown triggered by thermal sensor"),
            ]),
            new("CoolantSystemFailure",
            [
                new("CoolantPressureLowAlarm",  "Equipment", "High",     "Coolant pressure dropped below minimum level",           "Coolant leak or pump failure"),
                new("MotorOverheatAlarm",        "Equipment", "Critical", "Motor temperature rising due to lack of cooling",        "Coolant system failure"),
                new("EmergencyStopAlarm",        "Safety",    "Critical", "Emergency stop activated due to cooling failure",        "Automatic safety shutdown triggered by thermal sensor"),
            ]),
            new("MechanicalImbalance",
            [
                new("VibrationExcessiveAlarm",  "Equipment", "High",     "Excessive vibration detected on spindle axis",           "Bearing wear or mechanical imbalance"),
                new("LubricationFaultAlarm",    "Equipment", "Medium",   "Increased friction detected in spindle bearings",        "Bearing degradation causing lubrication starvation"),
                new("ToolBreakageAlarm",         "Process",   "High",     "Tool breakage detected due to spindle instability",      "Excessive vibration transferred to cutting tool"),
                new("EmergencyStopAlarm",        "Safety",    "Critical", "Emergency stop activated due to mechanical fault",       "Spindle vibration exceeded safe operating threshold"),
            ]),
            new("PowerFault",
            [
                new("PowerSupplyFaultAlarm",    "Equipment", "Critical", "Unstable voltage detected on main power supply",         "Grid fluctuation or internal PSU failure"),
                new("CyclicCommunicationFault", "Equipment", "Medium",   "Lost cyclic communication with PLC module",              "PLC module reset caused by power instability"),
                new("EmergencyStopAlarm",        "Safety",    "Critical", "Emergency stop activated due to power supply fault",     "Safety PLC triggered controlled shutdown"),
            ]),
            new("PneumaticFailure",
            [
                new("AirPressureLowAlarm",      "Equipment", "Medium",   "Pneumatic air pressure below operating range",           "Compressor fault or line leak"),
                new("DoorInterlockAlarm",        "Safety",    "Critical", "Safety door interlock failed due to low air pressure",   "Pneumatic door lock unable to engage"),
                new("EmergencyStopAlarm",        "Safety",    "Critical", "Emergency stop activated due to pneumatic failure",      "Safety interlock chain broken"),
            ]),
        ];

        private static object BuildAlarmData(
            Cmf.Navigo.BusinessObjects.Resource resource,
            Cmf.Navigo.BusinessObjects.Area area,
            Cmf.Navigo.BusinessObjects.Facility facility,
            Cmf.Foundation.BusinessObjects.Site site,
            Cmf.Foundation.BusinessObjects.Enterprise enterprise,
            (string Code, string Type, string Severity, string Description, string Cause) alarm,
            (string CorrelationId, string Operation, string Application, string CDMVersion, string Service) header)
        {
            return new
            {
                Header = new
                {
                    header.CorrelationId,
                    header.Operation,
                    DateTime = DateTime.Now.ToString("o"),
                    StartDateTime = DateTime.Now.ToString("o"),
                    Application = "AlarmGenerator",
                    header.CDMVersion,
                    header.Service
                },
                Action = "Set",
                Timestamp = DateTime.UtcNow.ToString("o"),
                Alarm = new
                {
                    alarm.Code,
                    alarm.Type,
                    alarm.Severity,
                    alarm.Description,
                    alarm.Cause
                },
                Resource = new { UID = resource.Id.ToString(), resource.Name },
                Area = new { UID = area.Id.ToString(), area.Name },
                Facility = new { UID = facility.Id.ToString(), facility.Name },
                Site = new { UID = site.Id.ToString(), site.Name },
                Enterprise = new { UID = enterprise.Id.ToString(), enterprise.Name }
            };
        }

        public async System.Threading.Tasks.Task RunAsync()
        {
            cts = new CancellationTokenSource();

            // Start listening for a shutdown key
            var inputTask = System.Threading.Tasks.Task.Run(() =>
            {
                Console.WriteLine("Press 's' to trigger a scenario;\nPress 'q' to quit.");
                while (!cts.Token.IsCancellationRequested)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar == 'q' || key.KeyChar == 'Q')
                    {
                        Console.WriteLine("\nShutdown initiated...");
                        cts.Cancel();
                        break;
                    }

                    if (key.KeyChar == 's' || key.KeyChar == 'S')
                    {
                        Console.WriteLine("\nScenario triggered.");
                        _trigger.Release();
                    }
                }
            });

            try
            {

                while (!cts.Token.IsCancellationRequested)
                {
                    await _trigger.WaitAsync(cts.Token);

                    if (!cts.Token.IsCancellationRequested)
                    {
                        #region ISA 95 Hierarchy Loading

                        var resource = GetResourceByName("COIL BEND#01", 3);
                        var area = (Cmf.Navigo.BusinessObjects.Area)new GetObjectByNameInput()
                        {
                            Name = resource.Area.Name,
                            Type = typeof(Cmf.Navigo.BusinessObjects.Area),
                            IgnoreLastServiceId = true,
                            LevelsToLoad = 2

                        }.GetObjectByNameSync().Instance;
                        var facility = (Cmf.Navigo.BusinessObjects.Facility)new GetObjectByNameInput()
                        {
                            Name = area.Facility.Name,
                            Type = typeof(Cmf.Navigo.BusinessObjects.Facility),
                            IgnoreLastServiceId = true,
                            LevelsToLoad = 2

                        }.GetObjectByNameSync().Instance;
                        var site = (Cmf.Foundation.BusinessObjects.Site)new GetObjectByNameInput()
                        {
                            Name = facility.Site.Name,
                            Type = typeof(Cmf.Foundation.BusinessObjects.Site),
                            IgnoreLastServiceId = true,
                            LevelsToLoad = 2

                        }.GetObjectByNameSync().Instance;
                        var enterprise = site.Enterprise;

                        #endregion

                        var stateModel = new GetObjectByNameInput()
                        {
                            Name = "SEMI E10",
                            Type = typeof(Cmf.Foundation.BusinessObjects.StateModel),
                            IgnoreLastServiceId = true
                        }.GetObjectByNameSync().Instance as Cmf.Foundation.BusinessObjects.StateModel;

                        try
                        {
                            resource = new ComplexLogResourceEventInput()
                            {
                                Resource = resource,
                                Reason = "Broken Coil",
                                StateModel = stateModel,
                                StateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to UnscheduledDown"),
                                IgnoreLastServiceId = true
                            }.ComplexLogResourceEventSync().Resource;

                            var selectedScenario = AlarmScenarios[_random.Next(AlarmScenarios.Length)];
                            var correlationId = Guid.NewGuid().ToString();

                            var events = selectedScenario.Alarms.Select(alarm =>
                                new PostEventInput()
                                {
                                    AppProperties = new Cmf.Foundation.BusinessOrchestration.DataPlatform.Domain.AppProperties()
                                    {
                                        ApplicationName = "AlarmGenerator",
                                        EventDefinition = "\\IoTEventDefinitions\\CDM\\Resource\\ResourceAlarm",
                                        EventTime = DateTime.UtcNow,
                                    },
                                    IgnoreLastServiceId = true,
                                    NumberOfRetries = 3,
                                    Data = Newtonsoft.Json.Linq.JObject.FromObject(
                                        BuildAlarmData(resource, area, facility, site, enterprise, (alarm.Code, alarm.Type, alarm.Severity, alarm.Description, alarm.Cause),
                                        (correlationId, "MachineAlarm", "AlarmGenerator", "11.2.4", "MachineAlarm")))
                                }).ToList();

                            Console.WriteLine($"Sending scenario '{selectedScenario.Name}' [{events.Count} alarms, correlationId={correlationId}] on {resource.Name}");
                            foreach (var e in events)
                                Console.WriteLine($"  -> {((string?)e.Data?["Alarm"]?["Code"]) ?? "?"} [{(string?)e.Data?["Alarm"]?["Severity"]}]");

                            var result = new PostEventsInput() { IoTEvents = events }.PostMultipleIoTEventsSync();
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error in simulation loop: {ex.Message}");
                        }
                        finally
                        {
                            resource = new ComplexLogResourceEventInput()
                            {
                                Resource = resource,
                                StateModel = stateModel,
                                StateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to Productive"),
                                IgnoreLastServiceId = true
                            }.ComplexLogResourceEventSync().Resource;

                            // Ensure we wait a bit before the next iteration to avoid overwhelming the system
                            await System.Threading.Tasks.Task.Delay(5000, cts.Token);
                        }

                    }
                }

            }
            catch (Exception ex)
            {
            }
            finally
            {
            }
        }
    }
}