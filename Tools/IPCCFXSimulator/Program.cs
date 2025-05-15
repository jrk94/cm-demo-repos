using Cmf.LightBusinessObjects.Infrastructure;

namespace IPCCFXSimulator
{
    internal class Program
    {
        private static async Task Main(string[] args)
        {
            ClientConfigurationProvider.ConfigurationFactory = () =>
            {
                return new ClientConfiguration()
                {
                    HostAddress = "nightly-dev-112-mes.apps.rhos.cm-mes.dev",
                    ClientTenantName = "MesDevelopment",
                    IsUsingLoadBalancer = false,
                    ClientId = "MES",
                    UseSsl = true,
                    SecurityAccessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6Ik1FUyIsInRlbmFudE5hbWUiOiJNZXNEZXZlbG9wbWVudCIsInN1YiI6ImFkbWluIiwic2NvcGUiOm51bGwsImV4dHJhVmFsdWVzIjpudWxsLCJ0eXBlIjoiUEFUIiwiaWF0IjoxNzQ3MzEyNzg3LCJleHAiOjE3NTUwMzk1OTksImF1ZCI6IkF1dGhQb3J0YWwiLCJpc3MiOiJBdXRoUG9ydGFsIn0.eN5Gyc1kCqlyoNIaRMTBbXMwq-Tq2p2mxpSfzuw4qQQCHjP6Cth1o4gFyL4UecDL1meoIqn5fz3LGSld1vxfDThHWQX64ZMixB2C6pNffDHbL-VMjGdEXSt1cxvRmk_NIgQ03bt06fuxbbpoBxSw71A8n2D8v8Y_Pm8fKt88s_rxd_Egc8USBE4cKzJde_7RJpDNB3xYEVb2mehIQLDxIApqH_jFa5xBuzRiMNGPV1baPX4WwIGe3-WlB2A3EDp1JePMeI3oMVS_9pu0JGDMT35cCgVq4v7SP0N-hgqOT-oNWDU6DUrVZYzocdYtLDgA-tFQ1_2AdYKCrSWCz_PPbg",
                    SecurityPortalBaseAddress = new Uri("https://nightly-dev-112-mes.apps.rhos.cm-mes.dev/SecurityPortal/tenant")
                };
            };

            await new ScenarioRunner().RunAsync();
        }
    }
}