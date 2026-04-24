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
                new("LubricationFaultAlarm",
                    "Equipment", "Medium",
                    "Main drive motor lubrication circuit reporting flow rate of 0.3 L/min against a required minimum of 1.2 L/min. Oil viscosity sensor indicates degraded lubricant consistency, suggesting the oil has exceeded its service interval. Micro-filter on lube circuit showing 94% blockage.",
                    "Lubrication oil has not been replaced in the last 2,400 operating hours, exceeding the 1,500-hour service interval. Particulate contamination from previous tool breakage event has clogged the inline micro-filter, restricting flow to the motor's main bearing journals."),
                new("MotorOverheatAlarm",
                    "Equipment", "Critical",
                    "Stator winding temperature on main drive motor M1 has reached 148°C, exceeding the Class F insulation rating threshold of 140°C. Thermal imaging on the drive cabinet shows hot spots concentrated on phase U and phase W terminals. Motor has been running at 112% of rated torque for the past 47 minutes, compounded by the failed lubrication causing increased bearing friction.",
                    "Combination of sustained overload operation and complete loss of bearing lubrication has driven winding temperatures beyond the safe operating envelope. Insufficient oil film on the motor's front bearing journal has increased friction torque by an estimated 18%, translating directly into additional resistive heating across the windings. Continued operation risks permanent insulation breakdown and motor winding failure."),
                new("EmergencyStopAlarm",
                    "Safety", "Critical",
                    "Hardwired emergency stop circuit (Safety Category 3, PL d) opened automatically by the thermal protection relay K3 after motor winding temperature exceeded the 150°C trip point. All servo axes have been brought to a controlled stop on the active deceleration ramp. Holding brakes engaged on vertical axis Z1 and Z2.",
                    "Automatic thermal shutdown triggered by bimetallic overcurrent relay in motor M1 protection circuit. The relay has latched and requires manual reset after the motor has cooled below 60°C. Safety PLC (Siemens S7-1500F) logged the event in the fault journal at the exact timestamp. The machine cannot be restarted until the lubrication fault is resolved, oil is replaced, and the thermal relay is manually reset by a qualified technician."),
            ]),
            new("CoolantSystemFailure",
            [
                new("CoolantPressureLowAlarm",
                    "Equipment", "High",
                    "Coolant delivery pressure at the spindle head has dropped from the nominal 6.2 bar to 1.8 bar over a 12-minute period. Coolant flow sensor FS-04 at the tool interface is measuring 2.1 L/min against a setpoint of 8.0 L/min. Coolant reservoir level has dropped 34 cm below normal operating level, suggesting active fluid loss.",
                    "Visual inspection by the operator identified a fractured push-fit coupling on the high-pressure coolant line feeding the spindle rotary union. The fracture is consistent with fatigue failure due to high-cycle vibration exposure. Coolant is leaking at an estimated rate of 6 L/min, rapidly depleting the 120-litre sump. The coolant pump is cavitating as it draws air into the circuit, further accelerating pressure loss."),
                new("CoolantTemperatureHighAlarm",
                    "Equipment", "High",
                    "Coolant return temperature has climbed to 67°C against a target operating range of 18–25°C. The heat exchanger is unable to maintain thermal equilibrium because the reduced coolant flow no longer provides adequate convective heat transfer at the cutting zone. Spindle bearing temperature (measured by embedded PT100 sensor) has risen from 32°C to 58°C in the last 8 minutes.",
                    "With only 26% of rated coolant flow reaching the spindle, the thermal energy generated at the tool-workpiece interface (estimated 1.4 kW for current feed and speed parameters) cannot be dissipated. The spindle bearings are absorbing heat conducted back through the tool shank, causing thermal expansion of the spindle shaft. At current rates the bearing preload will be lost within approximately 15 minutes, risking irreversible spindle damage."),
                new("EmergencyStopAlarm",
                    "Safety", "Critical",
                    "Emergency stop triggered by the spindle overtemperature safety function (STO — Safe Torque Off) after spindle bearing temperature exceeded the 65°C trip threshold defined in the machine safety parameters. Spindle decelerated from 4,200 RPM to rest in 3.1 seconds via the active braking resistor. Coolant pump P1 has been shut down to prevent dry-running damage.",
                    "The safety PLC executed the spindle STO function as designed, cutting drive power to the spindle motor while maintaining axis position locks. The coolant pump was halted by the same safety routine to prevent pump seal damage from cavitation. The fractured coolant line must be replaced, the sump refilled to the correct level, and the system bled of air before restart. A full spindle thermal soak test (30-minute run at 20% load) is required before returning to production."),
            ]),
            new("MechanicalImbalance",
            [
                new("VibrationExcessiveAlarm",
                    "Equipment", "High",
                    "Triaxial accelerometer mounted on the spindle housing (sensor ACC-02) is reporting peak vibration of 14.7 mm/s RMS in the radial direction at a dominant frequency of 183 Hz — exactly 2× the spindle rotation frequency at the current 5,500 RPM operating speed. ISO 10816-3 limit for this machine class is 4.5 mm/s RMS. The vibration signature is characteristic of a second-order imbalance, consistent with eccentric tool holder seating or a damaged collet.",
                    "Frequency spectrum analysis indicates the primary energy is concentrated at 2× and 4× running speed harmonics, ruling out electrical sources and pointing to a mechanical imbalance. The tool holder in position T12 (Ø32 face mill) was last balanced 1,840 hours ago against a recommended 500-hour interval. A secondary peak at 1,460 Hz correlates with the ball pass frequency of the outer race (BPFO) of the spindle front bearing, suggesting early-stage bearing defect."),
                new("LubricationFaultAlarm",
                    "Equipment", "Medium",
                    "Oil mist lubrication system for the spindle front bearing (SKF 7014 CD/P4A angular contact) is failing to maintain the required oil film thickness. Lubrication cycle counter shows 11,200 ms between pulses against a maximum interval of 8,000 ms. The bearing acoustic emission sensor is reporting increased high-frequency noise in the 100–300 kHz band, consistent with metal-to-metal asperity contact.",
                    "Excessive vibration from the imbalance condition has caused micro-pitting on the bearing race surface, increasing the bearing's internal clearance and allowing the oil mist nozzle to become partially misaligned. The increased clearance means the oil film is no longer being drawn into the bearing contact zone effectively. Without corrective action, the bearing will progress from the incipient defect stage to spalling failure within an estimated 40–80 operating hours."),
                new("ToolBreakageAlarm",
                    "Process", "High",
                    "Spindle torque monitoring system detected a step increase of 340% above baseline (from 18 Nm to 79 Nm) lasting 0.08 seconds, followed by a complete drop to 0 Nm — the characteristic signature of tool fracture. The broken insert is confirmed by the tool presence sensor in the magazine pocket. Material: EN 1.4301 stainless steel workpiece, Ø32 face mill at 5,500 RPM, feed 0.12 mm/tooth. Chip load at time of failure was 0.31 mm/tooth, 2.6× the recommended value due to axis feed rate anomaly.",
                    "Root cause is the combination of 14.7 mm/s spindle vibration causing chatter at the tool-workpiece interface, and a progressive feed rate override that had drifted to 260% of programmed value due to a corrupted axis parameter in the CNC part program loaded 3 shifts ago. The dynamic cutting forces amplified by chatter exceeded the fracture toughness (KIc) of the TiAlN-coated carbide insert. A broken insert fragment was ejected and has lodged in the workpiece fixture. The workpiece must be inspected for embedded debris before any further operations."),
                new("EmergencyStopAlarm",
                    "Safety", "Critical",
                    "Emergency stop executed by the CNC control (Fanuc 31i-B) following detection of tool breakage combined with active spindle vibration exceeding the Category 2 safety limit of 18 mm/s RMS. All linear axes arrested using dynamic braking. The automatic door interlock has engaged, preventing the enclosure from being opened until the spindle has reached zero speed and all energy is confirmed dissipated.",
                    "The CNC's built-in collision avoidance routine triggered a rapid retract on the Z-axis before stopping to prevent the broken tool from scoring the workpiece. Post-stop diagnostics logged: spindle bearing temperature 71°C, vibration 22.3 mm/s RMS (exceeding hardwired trip), axis position error on X within tolerance. A full mechanical inspection of the spindle cartridge is required before restart. The axis parameter file must be reloaded from the verified backup and validated against the master CNC program."),
            ]),
            new("PowerFault",
            [
                new("PowerSupplyFaultAlarm",
                    "Equipment", "Critical",
                    "Main DC bus voltage on the servo drive rack has collapsed from the nominal 560 VDC to 381 VDC over 220 milliseconds — a 32% sag. Power quality analyser (Fluke 435-II) on the incoming supply captured a 3-phase voltage unbalance of 8.7% and a THD (Total Harmonic Distortion) of 23.4%, well above the EN 61000-2-4 Class 3 limit of 10%. The drive's internal DC bus capacitor bank is showing a charge imbalance across the six capacitor modules, with module C4 at 71V against the mean of 93V.",
                    "The facility's main transformer (1,600 kVA, 20kV/400V) is sharing its secondary distribution with a newly commissioned 250 kW induction furnace on the adjacent production line. The furnace's cyclic load is introducing voltage dips of up to 12% at 2.4-second intervals, as measured at the MCC (Motor Control Centre) supplying this equipment. The degraded capacitor module C4 (estimated 68% of original capacitance due to age and thermal stress) is unable to adequately buffer the DC bus during the voltage dips, causing drive undervoltage faults on axes X, Y and the spindle drive."),
                new("CyclicCommunicationFault",
                    "Equipment", "Medium",
                    "PROFINET IRT (Isochronous Real-Time) cyclic communication between the Siemens S7-1500 PLC and the Bosch Rexroth IndraDrive servo drives has been interrupted. The PLC diagnostic buffer shows 14 consecutive missed cycles on the 1 ms PROFINET bus, triggering a bus timeout on drives X1, Y1, and S1 (spindle). Network switch port diagnostics report 847 CRC errors in the last 60 seconds on port P4 (the segment feeding the drive cabinet).",
                    "The DC bus voltage collapse caused a momentary brownout of the 24 VDC control supply, which in turn caused the managed Ethernet switch in the control cabinet to perform an uncontrolled restart. The switch's restart time of ~8 seconds far exceeded the PROFINET watchdog timeout (configured at 3× 1 ms = 3 ms), causing all drives on that network segment to enter a safe state and disable their power stages. The Ethernet cable between the switch and the drive cabinet has also been found to be a Cat5e unshielded cable routed alongside a 400V power cable — a known noise coupling risk that is exacerbating the CRC error rate."),
                new("EmergencyStopAlarm",
                    "Safety", "Critical",
                    "Safety PLC (Siemens S7-1500F, F-CPU) initiated a Category 0 stop (immediate removal of power to drives) after detecting simultaneous DC bus undervoltage and loss of PROFINET communication to the safety-rated drives. All STO (Safe Torque Off) signals have been activated. The safety door magnetic lock has been de-energised as part of the safety function, preventing operator access. UPS (Uninterruptible Power Supply) on the control cabinet has taken over the 24 VDC rail and is maintaining PLC and HMI operation.",
                    "The safety PLC's logic correctly identified that the combination of power instability and lost drive communication represented an uncontrolled machine state that could not be guaranteed safe. Per the machine's SISTEMA safety assessment (PL d, Cat 3), the safety function demanded a stop within the reaction time of 8 ms — the actual response was 4.2 ms, within specification. To restore operation: replace capacitor module C4, install a line reactor on the incoming supply to mitigate voltage dips from the furnace, replace the Cat5e cable with shielded Cat6a, and segregate Ethernet cabling from power cabling per IEC 61918 installation guidelines."),
            ]),
            new("PneumaticFailure",
            [
                new("AirPressureLowAlarm",
                    "Equipment", "Medium",
                    "System air pressure at the machine's pneumatic manifold has dropped from the nominal 6.5 bar to 3.1 bar over 18 minutes. The pressure decay rate (0.19 bar/min) is consistent with a medium-sized leak. Automated leak detection cycle (initiated by the PLC at shift start) reported a pressure decay of 0.43 bar over 60 seconds with all solenoids closed, confirming a leak in a static circuit. Compressed air consumption meter shows 187 NL/min against the idle baseline of 12 NL/min.",
                    "Maintenance log review identified that the polyurethane pneumatic tubing (Ø6mm OD) on the workpiece clamping fixture was replaced 3 days ago using a batch of tubing that has since been quarantined by the supplier due to out-of-spec wall thickness (measured 0.8mm vs. the required 1.0mm). The under-spec tubing has developed a 3–4mm longitudinal split at a 90° elbow fitting where bending stress concentrates, located inside the fixture baseplate and not visible without partial disassembly. At the measured leak rate, the ring main compressor cannot maintain system pressure and is running at 100% duty cycle, risking compressor overheating."),
                new("ClampingPressureFaultAlarm",
                    "Process", "High",
                    "Workpiece clamping cylinder C3 (responsible for primary radial clamping of the coil bending mandrel) is unable to develop and hold the minimum required clamping force of 4,200 N. Pressure transducer PT-C3 on the cylinder's cap-end port is reading 2.9 bar, which corresponds to approximately 1,840 N — only 44% of the required clamping force. The cylinder's rod-end bleed port shows positive pressure (1.1 bar), indicating the piston seal is bypassing.",
                    "The reduced system supply pressure (3.1 bar) combined with a degraded piston seal on cylinder C3 (seal age: 4.2 years, recommended replacement interval: 3 years) has resulted in insufficient clamping force. At this clamping force, the bending operation would impose a displacement on the workpiece of approximately 0.8mm under peak bending load, causing dimensional non-conformance on the bend radius (tolerance: ±0.15mm) and creating a risk of the workpiece being ejected from the fixture during the high-force phase of the bending cycle."),
                new("DoorInterlockAlarm",
                    "Safety", "Critical",
                    "Safety guard door on the operator access side (Door Zone 2, IEC 62061 SIL 2) has failed to achieve the locked state as confirmed by the dual-channel safety door monitor (Pilz PNOZ m B0). Channel 1 (mechanical bolt sensor) reports locked; Channel 2 (reed switch on pneumatic bolt actuator) reports unlocked — a discrepancy that the safety monitor correctly interprets as a fault condition rather than a valid locked state. The pneumatic bolt actuator requires a minimum of 4.5 bar to fully extend and engage the door strike; current supply pressure is 3.1 bar.",
                    "The pneumatic door locking mechanism on Zone 2 relies on a spring-return cylinder that drives a hardened steel bolt into a strike plate on the door frame. At 3.1 bar supply pressure, the cylinder develops only 78% of its rated force, insufficient to overcome the combined spring return force and the increased friction in the bolt mechanism (last lubricated 14 months ago against a 6-month interval). The dual-channel discrepancy detected by the safety monitor is the correct and expected response — the system is behaving as designed by flagging a potentially unsafe state rather than assuming the door is secure based on one channel alone."),
                new("EmergencyStopAlarm",
                    "Safety", "Critical",
                    "Safety PLC executed a Category 1 controlled stop (decelerate to rest, then remove power) after the dual-channel door monitor reported a locking discrepancy on Zone 2 while a bending cycle was in progress. The bending ram was 34% into its stroke at the time of the stop command; the hydraulic system performed a controlled retract to the home position before power was removed. All pneumatic actuators have been exhausted to atmosphere via the safety exhaust valve, and the system is in a zero-energy state.",
                    "The safety architecture correctly prioritised the ambiguous door lock state over the in-progress production cycle. The controlled stop (vs. an immediate Category 0) was selected because the risk assessment determined that a controlled deceleration presented lower risk of workpiece ejection than an instantaneous stop mid-stroke. To restore the machine: repair the pneumatic leak and replace the out-of-spec tubing across the entire fixture (all suspect batch), rebuild the clamping cylinder C3 piston seal, lubricate the door bolt mechanism, validate all pneumatic pressures above 5.5 bar at all circuits, and perform a full dual-channel safety monitor validation test before releasing the machine to production."),
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
                            // Ensure we wait a bit before the next iteration to avoid overwhelming the system
                            await System.Threading.Tasks.Task.Delay(15000, cts.Token);
                            resource = new ComplexLogResourceEventInput()
                            {
                                Resource = resource,
                                StateModel = stateModel,
                                StateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to Productive"),
                                IgnoreLastServiceId = true
                            }.ComplexLogResourceEventSync().Resource;
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