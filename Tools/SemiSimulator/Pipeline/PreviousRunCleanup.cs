using System.Text.RegularExpressions;
using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Line;
using SemiSimulator.Mes;

namespace SemiSimulator.Pipeline
{
    /// <summary>
    /// Cascade-terminates what earlier runs left behind, like the SMT/OIB simulators' --terminateonstart: every
    /// material of the simulator's production orders (lots, split lots, wafers), then the orders themselves. Only
    /// orders named the way <see cref="OrderSource"/> names them are touched ("{prefix}.{8 hex}"): the MES master data
    /// has orders with the same prefix (e.g. "PO SC.0001"). Consumables the simulator created are kept.
    /// </summary>
    public sealed class PreviousRunCleanup(LineDefinition line, IMesGateway mes, ILogger<PreviousRunCleanup> logger)
    {
        // Same chunk size as the other simulators
        private const int chunkSize = 100;

        /// <summary>Whether the production order was created by the simulator (see <see cref="OrderSource"/>).</summary>
        public static bool IsSimulatorOrder(string orderName, string prefix) =>
            Regex.IsMatch(orderName, $"^{Regex.Escape(prefix)}\\.[0-9A-F]{{8}}$");

        public void Run()
        {
            string prefix = line.Order.ProductionOrderPrefix;
            var reason = mes.MasterData.GetByName<Reason>(line.Startup.TerminateReason)
                ?? throw new InvalidOperationException($"Reason '{line.Startup.TerminateReason}' (Line:Startup:TerminateReason) not found");

            var orderNames = mes.MasterData.FindOpenProductionOrders($"{prefix}.").Where(o => IsSimulatorOrder(o, prefix)).ToList();
            var materialNames = OpenMaterials(prefix);
            logger.LogInformation($"Terminating previous runs: {materialNames.Count} material(s) of {orderNames.Count} production order(s) '{prefix}.*'");

            if (materialNames.Count > 0)
            {
                var materials = Load(materialNames);

                // A material in process cannot be terminated: abort it first
                AbortInProcess(materials);

                // Parents first: terminating a lot may take its wafers along; whatever is left goes next
                TerminateChunks(Load(materials.Where(m => m.ParentMaterial == null).Select(m => m.Name)), reason);
                TerminateChunks(Load(OpenMaterials(prefix)), reason);

                // Anything still in process (an abort that failed, a lot that started again meanwhile): once more
                var remaining = Load(OpenMaterials(prefix));
                if (remaining.Any(m => m.SystemState == MaterialSystemState.InProcess))
                {
                    logger.LogWarning($"{remaining.Count(m => m.SystemState == MaterialSystemState.InProcess)} material(s) still in process after the first pass: aborting them again");
                    AbortInProcess(remaining);
                    TerminateChunks(Load(OpenMaterials(prefix)), reason);
                }

                int left = OpenMaterials(prefix).Count;
                if (left > 0)
                {
                    logger.LogWarning($"{left} material(s) of the simulator's production orders could not be terminated");
                }
            }

            foreach (var orderName in orderNames)
            {
                try
                {
                    var order = mes.MasterData.GetByName<ProductionOrder>(orderName);
                    if (order != null)
                    {
                        mes.MasterData.Terminate(order);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning($"Could not terminate production order '{orderName}': {ex.Message}");
                }
            }
            logger.LogInformation($"Terminated previous runs ({orderNames.Count} production order(s))");
        }

        /// <summary>
        /// The materials to abort: those in process that no in-process material holds (aborting a lot also aborts its
        /// wafers). A wafer in process whose lot is not in process (a lot that already moved on) is aborted on its own.
        /// </summary>
        public static List<Material> AbortTargets(IReadOnlyCollection<Material> materials)
        {
            var inProcess = materials.Where(m => m.SystemState == MaterialSystemState.InProcess).ToList();
            var names = inProcess.Select(m => m.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
            return inProcess.Where(m => m.ParentMaterial == null || !names.Contains(m.ParentMaterial.Name)).ToList();
        }

        private void AbortInProcess(IReadOnlyCollection<Material> materials)
        {
            var targets = AbortTargets(materials);
            logger.LogInformation($"Aborting {targets.Count} material(s) in process");
            foreach (var material in targets)
            {
                try
                {
                    mes.Materials.AbortProcess([material]);
                    logger.LogDebug($"Aborted '{material.Name}' at {material.FlowPath}");
                }
                catch (Exception ex)
                {
                    logger.LogWarning($"Could not abort '{material.Name}': {ex.Message}");
                }
            }
        }

        /// <summary>The blocking batches an MES termination error names: "The Objects are BATCH-26-31 (Batch)."</summary>
        public static List<string> BlockingBatches(string message) =>
            Regex.Matches(message, @"([^\s,]+) \(Batch\)").Select(m => m.Groups[1].Value).Distinct().ToList();

        /// <summary>
        /// Terminates one material, repairing what the MES says is in the way (up to twice): a loss reason the step does not
        /// accept (another one the step accepts, or, when the step has none, the lot moves to the start step first), or a
        /// batch that still holds the lot (the batch is cancelled).
        /// </summary>
        private void TerminateOne(string materialName, Reason reason)
        {
            for (int attempt = 0; ; attempt++)
            {
                var material = mes.Materials.GetByName(materialName)!;
                try
                {
                    mes.Materials.Terminate(material, reason);
                    return;
                }
                catch (Exception ex)
                {
                    if (attempt >= 2 || !Repair(material, ex.Message, ref reason))
                    {
                        throw;
                    }
                }
            }
        }

        private bool Repair(Material material, string message, ref Reason reason)
        {
            if (message.Contains("must have Loss Reasons defined", StringComparison.OrdinalIgnoreCase) && material.Step != null)
            {
                var accepted = TerminateReasonsOf(material.Step);
                if (accepted.Count > 0)
                {
                    reason = accepted.FirstOrDefault(r => r.Name.Equals(line.Startup.TerminateReason, StringComparison.OrdinalIgnoreCase)) ?? accepted[0];
                    logger.LogDebug($"'{material.Name}' is at '{material.Step.Name}', which terminates with '{reason.Name}'");
                    return true;
                }

                // A step without terminate reasons (e.g. PREPARATION WPREP): from the start step on, the lot can be terminated
                var profiles = line.Order.Profiles();
                var start = (profiles.FirstOrDefault(p => p.Product == material.Product?.Name) ?? profiles[0]).StartFlowPath;
                mes.Materials.MoveToNextStep(material, start);
                logger.LogDebug($"'{material.Name}' moved from '{material.Step.Name}' to '{start}' to be terminated");
                return true;
            }

            var batches = BlockingBatches(message);
            foreach (var name in batches)
            {
                CancelBatch(name);
            }
            return batches.Count > 0;
        }

        private readonly Dictionary<long, List<Reason>> _terminateReasons = [];

        /// <summary>The reasons a step can terminate a material with (its StepReason relations applicable to terminate).</summary>
        private List<Reason> TerminateReasonsOf(Step step)
        {
            if (!_terminateReasons.TryGetValue(step.Id, out var reasons))
            {
                var loaded = mes.MasterData.LoadRelations(mes.MasterData.GetById<Step>(step.Id)!, "StepReason")!;
                reasons = loaded.RelationCollection.ContainsKey("StepReason")
                    ? loaded.RelationCollection["StepReason"].Cast<StepReason>()
                        .Where(r => r.ApplicableToTerminate == true)
                        .Select(r => mes.MasterData.GetById<Reason>(r.TargetEntity.Id)!).ToList()
                    : [];
                _terminateReasons[step.Id] = reasons;
            }
            return reasons;
        }

        /// <summary>Cancels a batch that holds simulator lots (leftover of a run that was stopped); one in process is aborted first.</summary>
        private void CancelBatch(string name)
        {
            var batch = mes.MasterData.GetByName<Batch>(name);
            if (batch == null || batch.UniversalState == Cmf.Foundation.Common.Base.UniversalState.Terminated)
            {
                return;
            }

            var batches = new BatchCollection();
            batches.Add(batch);
            if (batch.SystemState == BatchSystemState.InProcess)
            {
                mes.Batches.Abort(batch);
            }
            mes.Batches.Cancel(batches);
            logger.LogDebug($"Cancelled batch '{name}' that held simulator lots");
        }

        private List<string> OpenMaterials(string prefix) =>
            mes.Materials.FindOpenByProductionOrder($"{prefix}.").Where(m => IsSimulatorOrder(m.ProductionOrder, prefix)).Select(m => m.Material).ToList();

        private List<Material> Load(IEnumerable<string> names) =>
            names.Chunk(chunkSize).SelectMany(chunk => mes.Materials.GetByNames(chunk)).ToList();

        private void TerminateChunks(List<Material> materials, Reason reason)
        {
            foreach (var chunk in materials.Where(m => m.UniversalState != Cmf.Foundation.Common.Base.UniversalState.Terminated).Chunk(chunkSize))
            {
                var collection = new MaterialCollection();
                collection.AddRange(chunk);
                try
                {
                    mes.Materials.Terminate(collection, reason);
                    logger.LogDebug($"Terminated {chunk.Length} material(s)");
                }
                catch (Exception ex)
                {
                    // One bad material fails the whole call: retry one by one so the rest still goes
                    logger.LogDebug($"Terminating {chunk.Length} material(s) together failed ({ex.Message}); retrying one by one");
                    foreach (var material in chunk)
                    {
                        try
                        {
                            TerminateOne(material.Name, reason);
                        }
                        catch (Exception single)
                        {
                            logger.LogDebug($"Could not terminate '{material.Name}': {single.Message}");
                        }
                    }
                }
            }
        }
    }
}
