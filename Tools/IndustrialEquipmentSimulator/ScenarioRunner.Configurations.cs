using Cmf.Foundation.BusinessObjects;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.ResourceManagement.InputObjects;
using IndustrialEquipmentSimulator.Services;
using System.Collections.Concurrent;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        private decimal _speed;
        private CancellationTokenSource cts;
        private readonly IEventsService _eventsService;

        private readonly Dictionary<string, double> datacollection = new() {
            { "Paint Thickness - Top Edge", 120 },
            { "Paint Thickness - Bottom Edge", 120 },
            { "Paint Thickness - Center", 120 },
            { "Paint Thickness - Left Side", 120 },
            { "Paint Thickness - Right Side", 120 }
        };
        private readonly Dictionary<string, string> datacollectionGauges = new() {
            { "Paint Thickness Gauge 0001", "Nominal"},
            { "Paint Thickness Gauge 0002", "Nominal"},
            { "Paint Thickness Gauge 0003", "Nominal"},
            { "Paint Thickness Gauge 0004", "Defect"},
            { "Paint Thickness Gauge 0005", "Nominal"},
        };

        private readonly Dictionary<string, List<string>> availableProducts = new() {
            { "MetalPlate", [
                "RTU-FRONT C",
                "RTU-FRONT W",
                "RTU-FRAME W",
                "RTU-FRAME C",
                "RTU-LATERAL W",
                "RTU-LATERAL C"
                ]
            },
            { "CoilCopper", [ "ALU-COIL-4ROW" , "COP-COIL-4ROW"]},
            { "Coil", ["ALU-COIL-4ROW"]},
            { "Copper", [ "COP-COIL-4ROW"]},
            { "Electric", [ "VFD-10HP"]},
            { "Foam", [ "FOAM-XR435"]},
            { "FinalAssembly", [ "Rooftop Unit - HVAC RTU"]},
        };

        private readonly Dictionary<string, double> employeeDefect = new() {
            { "Bob Operator", 1},
            { "Anna Operator", 0.01},
            { "Jeff Operator", 0.05},
            { "John Operator", 0.1},
            { "Tim Operator", 0.2}
        };

        private readonly Dictionary<string, List<string>> availableResources = new() {
            // Metal Plate
            { "Punch", ["PUNCH#01"] },
            { "Bend", ["BEND#01"] },
            { "Coating", ["COATING"]},
            { "Coloring", ["COLORING#01"] },
            { "PlatePainting", ["PAINTING#01"] },

            // CoilCopper
             { "CoilBend", ["COIL BEND#01"] },
             { "CopperBend", ["COPPER BEND#01"] },
             { "IndoorBraze", ["INDOOR BRAZE"] },
             { "OutdoorBraze", ["OUTDOOR BRAZE"] },
             { "CompressorTubBraze", ["COMPRESSOR TUB BRAZE"] },
             { "CoilTreatment", ["COIL TREATMENT"] },
             
            // Electric
             { "MainBoard", ["MAIN BOARD"] },
             { "DoorPrep", ["DOOR PREP"] },
             { "FilterPrep", ["FILTER PREP"] },
             { "StagingMB", ["STAGING MB"] },

             // Foam
             { "FoamPrep", ["FOAM PREP"] },
             { "Foam", ["FOAM"] },

             // Final Assembly
             { "BaseAsm", ["BAY0"] },
             { "HeatModCompTub", ["BAY1"] },
             { "InstallOdCoilTubes", ["BAY1"] },
             { "NitrogenEvacCharge", ["BAY2"] },
             { "ApplyFoam", ["BAY2"] },
             { "FinalWiring", ["BAY2"] },
             { "QualityInsp", ["Quality Work Station"] },
             { "InstallCoverDoorsFansAndRoof", ["BAY3"] },
             { "CleanUpAndInspection", ["CLEANUP AND INSPECTION"] },
             { "RTUPacking", ["RTU PACKING"] },
             { "RTUFinalPacking", ["RTU FINAL PACKAGING"] },
        };

        private static readonly string[] lossReasons = ["Broken-Loss", "Scratch-Loss"];

        private readonly string lotForm = "Lot";
        private readonly ConcurrentDictionary<string, string> defectMaterials = [];
        private static readonly object _trackLock = new object();

        private Dictionary<string, StateModel> _stateModel = [];

        private void LoadStateModels()
        {
            _stateModel.Add("SEMIE58", new GetObjectByNameInput()
            {
                Name = "SEMI E58",
                Type = typeof(Cmf.Foundation.BusinessObjects.StateModel),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Foundation.BusinessObjects.StateModel);

            _stateModel.Add("SEMIE10", new GetObjectByNameInput()
            {
                Name = "SEMI E10",
                Type = typeof(Cmf.Foundation.BusinessObjects.StateModel),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Foundation.BusinessObjects.StateModel);

            _stateModel.Add("InduTech State Model", new GetObjectByNameInput()
            {
                Name = "InduTech State Model",
                Type = typeof(Cmf.Foundation.BusinessObjects.StateModel),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Foundation.BusinessObjects.StateModel);
        }

        private void ResourcesStartInStandby()
        {
            foreach (var resourceList in this.availableResources.Values)
            {
                foreach (var resourceName in resourceList)
                {
                    var resource = GetResourceByName(resourceName);
                    if (resource.CurrentMainState.CurrentState.Name != "Standby")
                    {
                        StateModel stateModel;
                        try
                        {
                            stateModel = _stateModel[resource.CurrentMainState.StateModel.Name.Replace(" ", "")];
                        }
                        catch
                        {
                            stateModel = _stateModel[resource.CurrentMainState.StateModel.Name];
                        }
                        var stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to Standby");
                        Console.WriteLine($"Resource {resourceName} will be changed to Standby");
                        try
                        {
                            resource = new ComplexLogResourceEventInput()
                            {
                                Resource = resource,
                                Reason = "SBY",
                                StateModel = stateModel,
                                StateModelTransition = stateModelTransition,
                                IgnoreLastServiceId = true
                            }.ComplexLogResourceEventSync().Resource;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Resource {resourceName} will be changed to Standby - Previous try {ex.Message}");
                            resource = new ComplexLogResourceEventInput()
                            {
                                Resource = resource,
                                Reason = "No WIP",
                                StateModel = stateModel,
                                StateModelTransition = stateModelTransition,
                                IgnoreLastServiceId = true
                            }.ComplexLogResourceEventSync().Resource;
                        }
                    }
                }
            }
        }
    }
}
