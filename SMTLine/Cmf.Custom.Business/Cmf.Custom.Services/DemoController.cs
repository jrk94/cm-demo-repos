using Microsoft.AspNetCore.Mvc;

namespace Cmf.Custom.Demo.Services
{
    /// <summary>
    /// Demo Services
    /// </summary>
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class DemoController : ControllerBase
    {
        private const string OBJECT_TYPE_NAME = "Cmf.Custom.Demo.Services.DemoManagement";
    }
}