using Cmf.Foundation.BusinessObjects;
using Cmf.Foundation.BusinessObjects.QueryObject;
using Cmf.Foundation.BusinessOrchestration;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Foundation.Common;
using Cmf.Navigo.BusinessObjects;

namespace AlarmGenerator
{
    public partial class ScenarioRunner
    {
        private static T Retrier<T>(Func<T> serviceToCall, int retryCount = 0) where T : BaseOutput
        {
            try
            {
                return serviceToCall();
            }
            catch (Exception ex)
            {
                if (retryCount > 4)
                {
                    throw ex;
                }
                if (ex.Message.Contains("has changed since last viewed") ||
                    ex.Message.Contains("deadlocked on lock resources"))
                {
                    System.Threading.Thread.Sleep(5000);
                    return Retrier(serviceToCall, retryCount + 1);
                }
                else
                {
                    throw ex;
                }
            }
        }

        private static Cmf.Navigo.BusinessObjects.Resource? GetResourceByName(string resourceName, int levelsToLoad = 0)
        {
            return new GetObjectByNameInput()
            {
                Name = resourceName,
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource),
                IgnoreLastServiceId = true,
                LevelsToLoad = levelsToLoad
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;
        }

        private static Material? GetMaterialByName(Material? panel)
        {
            panel = new GetObjectByNameInput()
            {
                Name = panel.Name,
                Type = typeof(Cmf.Navigo.BusinessObjects.Material),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;
            return panel;
        }

        public static Y GetObjectsByName<T, Y>(IEnumerable<T> entities, int levelsToLoad = 1)
            where T : Entity
            where Y : IList<T>, new()
        {
            Filter nameFilter = new Filter()
            {
                Name = "Name",
                Operator = FieldOperator.In,
                Value = entities.Select(e => e.Name)
            };

            var collection = new Y();
            foreach (var item in new GetObjectsByFilterInput()
            {
                Type = Activator.CreateInstance<T>(),
                LevelsToLoad = levelsToLoad,
                Filter = new FilterCollection() { nameFilter }
            }.GetObjectsByFilterSync().Instance.Cast<T>())
            {
                collection.Add(item);
            }
            return collection;
        }
    }
}