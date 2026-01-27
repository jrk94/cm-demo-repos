using Cmf.LightBusinessObjects.Infrastructure;
using IndustrialEquipmentSimulator.Objects;
using Microsoft.Extensions.Options;

namespace IndustrialEquipmentSimulator.Services
{
    public class EventsService : IEventsService
    {
        private readonly Events _events;

        public EventsService(ITokenService tokenService, IOptions<ClientConfiguration> clientConfiguration)
        {
            _events = new Events(tokenService, clientConfiguration);
        }

        public Events GetEvents() => _events;
    }
}