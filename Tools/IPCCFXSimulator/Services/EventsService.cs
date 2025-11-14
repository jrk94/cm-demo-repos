using CFX.Structures.SolderReflow;
using Cmf.LightBusinessObjects.Infrastructure;
using IPCCFXSimulator.Objects;
using Microsoft.Extensions.Options;

namespace IPCCFXSimulator.Services
{
    public class EventsService : IEventsService
    {
        private readonly Events _events;
        private readonly string[] _availableProducts = ["SMT PowerUnit_DP_A", "SMT PowerUnit_DP_B", "SMT PowerUnit_DP_C", "SMT PowerUnit_DP_D"];

        public EventsService(ITokenService tokenService, IOptions<ClientConfiguration> clientConfiguration)
        {
            _events = new Events(new Dictionary<string, ReflowProcessData>
            {
                {
                   _availableProducts[0],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_A)
                    }
                },
                {
                    _availableProducts[1],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_B)
                    }
                },
                {
                    _availableProducts[2],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_C)
                    }
                },
                {
                    _availableProducts[3],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_D)
                    }
                }
            }, tokenService, clientConfiguration);
        }

        public Events GetEvents() => _events;
    }
}