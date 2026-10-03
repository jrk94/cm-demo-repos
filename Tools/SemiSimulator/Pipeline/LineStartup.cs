using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Line;
using SemiSimulator.Mes;
using SemiSimulator.Steps;

namespace SemiSimulator.Pipeline
{
    /// <summary>
    /// Gets the MES ready before lots start: optionally clears previous runs, every configured resource in Standby,
    /// time constraints off.
    /// </summary>
    public sealed class LineStartup(
        LineDefinition line,
        IMesGateway mes,
        ResourceCatalog resources,
        StateModelCache stateModels,
        IOperatorCheckIn operatorCheckIn,
        PreviousRunCleanup cleanup,
        ILogger<LineStartup> logger)
    {
        private const string timeConstraintsSmartTable = "TimeConstraintsContext";

        // Steps such as AOI send e-mails from future actions; with mail on, moving lots onto them fails
        private const string mailEnabledConfig = "/Cmf/System/Configuration/Mail/Enabled/";

        public void Prepare()
        {
            foreach (var step in line.Steps.Where(s => !s.PassThrough && !resources.HasResources(s.Name)))
            {
                logger.LogWarning($"Step '{step.Name}' has no resources (in line.json or in the MES): lots reaching it will stop there");
            }

            if (line.Startup.DisableMail)
            {
                DisableMail();
            }
            DisableDeeActions();
            if (line.Startup.TerminatePreviousRuns)
            {
                cleanup.Run();
            }
            if (line.Startup.CheckInOperator)
            {
                operatorCheckIn.EnsureOperator();
            }
            ResourcesStartInStandby();
            if (line.Startup.DisableTimeConstraints)
            {
                DisableTimeConstraints();
            }
        }

        /// <summary>
        /// Sets /Cmf/System/Configuration/Mail/Enabled/ to false, so e-mail future actions do not run.
        /// </summary>
        private void DisableMail()
        {
            var config = mes.MasterData.GetConfig(mailEnabledConfig);
            if (string.Equals(config.Value?.ToString(), "false", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogDebug($"Config '{mailEnabledConfig}' is already false");
                return;
            }

            config.Value = false;
            mes.MasterData.UpdateConfig(config);
            logger.LogInformation($"Set config '{mailEnabledConfig}' to false");
        }

        /// <summary>
        /// Disables the DEE actions listed in Line:Startup:DisableDeeActions that are enabled.
        /// </summary>
        private void DisableDeeActions()
        {
            foreach (var actionName in line.Startup.DisableDeeActions)
            {
                var action = mes.MasterData.GetDeeAction(actionName);
                if (!action.IsEnabled)
                {
                    logger.LogDebug($"DEE action '{actionName}' is already disabled");
                    continue;
                }

                mes.MasterData.DisableDeeAction(action);
                logger.LogInformation($"Disabled DEE action '{actionName}'");
            }
        }

        /// <summary>
        /// Puts every configured resource in Standby, with its own state model.
        /// </summary>
        private void ResourcesStartInStandby()
        {
            foreach (var resourceName in resources.AllResources)
            {
                var resource = mes.Resources.GetByName(resourceName);
                var stateModel = stateModels.ForResource(resource);
                if (stateModel == null || resource!.CurrentMainState.CurrentState.Name == "Standby")
                {
                    continue;
                }

                var transition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to Standby");
                logger.LogDebug($"Resource {resourceName} will be changed to Standby");
                try
                {
                    mes.Resources.LogEvent(resource, "SBY", stateModel, transition);
                }
                catch (Exception ex)
                {
                    logger.LogError($"Resource {resourceName} will be changed to Standby - Previous try {ex.Message}");
                    mes.Resources.LogEvent(resource, "No WIP", stateModel, transition);
                }
            }
        }

        /// <summary>
        /// The simulator ignores time constraints: clears the TimeConstraintsContext smart table and switches time
        /// constraints off on every configured step.
        /// </summary>
        private void DisableTimeConstraints()
        {
            var smartTable = mes.MasterData.GetSmartTable(timeConstraintsSmartTable, loadData: true);

            var data = smartTable.Data != null ? Utilities.ToDataSet(smartTable.Data) : null;
            int rowCount = data?.Tables.Count > 0 ? data.Tables[0].Rows.Count : 0;

            if (rowCount == 0)
            {
                logger.LogDebug($"Smart table '{timeConstraintsSmartTable}' is already empty");
            }
            else
            {
                mes.MasterData.RemoveSmartTableRows(smartTable, smartTable.Data!);
                logger.LogInformation($"Removed {rowCount} row(s) from smart table '{timeConstraintsSmartTable}'");
            }

            // Also switch the feature off on each configured step, whether or not the table had rows
            foreach (var stepName in line.Steps.Select(s => s.Name))
            {
                Step? step;
                try
                {
                    step = mes.MasterData.GetByName<Step>(stepName);
                }
                catch (Exception ex)
                {
                    // Steps not yet matched to an MES step must not stop the simulator from starting
                    logger.LogError($"Step '{stepName}' not found, time constraints not changed: {ex.Message}");
                    continue;
                }

                if (step != null && step.EnableTimeConstraints != false)
                {
                    step.EnableTimeConstraints = false;
                    mes.MasterData.UpdateStep(step);
                    logger.LogInformation($"Disabled time constraints for {step.Name}");
                }
            }
        }
    }
}
