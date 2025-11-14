using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.DispatchManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;

namespace IPCCFXSimulator
{
    public partial class ScenarioRunner
    {
        private async System.Threading.Tasks.Task OffLineExecution(Material mat, decimal speed, string startResource = "THT01", string stepName = "THT")
        {
            try
            {
                while (stepName != "PCBA Stock")
                {
                    int executionTime = Decimal.ToInt32(new Random().Next(15, 45) * 1000 / speed);

                    _scenario.Log.Debug($"TrackIn on {stepName} {mat?.Name} {executionTime / 4}");

                    var getDispatchListForMaterial = new GetDispatchListForMaterialInput()
                    {
                        Material = GetMaterialByName(mat),
                        LevelsToLoad = 2
                    }.GetDispatchListForMaterialSync();

                    startResource = getDispatchListForMaterial.Resources.FirstOrDefault().Name;

                    await System.Threading.Tasks.Task.Delay(executionTime / 4);

                    mat = DispatchAndTrackInMaterial(mat, startResource, this._stateModel);

                    _scenario.Log.Debug($"TrackedIn {stepName} {mat?.Name}");

                    _scenario.Log.Debug($"Tracking Out on {stepName} {mat?.Name} {executionTime}");

                    await System.Threading.Tasks.Task.Delay(executionTime);

                    var getDataForMultipleTrackOutAndMoveNextWizard = new GetDataForMultipleTrackOutAndMoveNextWizardInput()
                    {
                        Materials = [GetMaterialByName(mat)],
                        MaterialLevelsToLoad = 1,
                        Operation = GetDataForTrackOutAndMoveNextOperation.TrackOutAndMoveNext
                    }.GetDataForMultipleTrackOutAndMoveNextWizardSync();

                    var nextFlowPath = getDataForMultipleTrackOutAndMoveNextWizard.NextStepsResults.First().FlowPath;
                    stepName = getDataForMultipleTrackOutAndMoveNextWizard.NextStepsResults.First()?.Step?.Name;
                    startResource = getDataForMultipleTrackOutAndMoveNextWizard.Resource?.Name;

                    mat = TrackOutAndMoveNextMaterial(mat, nextFlowPath, this._stateModel);

                    _scenario.Log.Debug($"Tracked Out on {stepName} {mat?.Name}");
                }
            }
            catch (Exception ex)
            {
                _scenario.Log.Error($"Something went wrong OffLineExecution {ex.Message}");
            }
        }
    }
}