using MediaTagger.Interfaces;

namespace MediaTagger.Hubs
{
    public class SignalRModule : IModule
    {
        public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
        {
      endpoints.MapHub<LogHub>("/log");
      return endpoints;
        }

        public IServiceCollection RegisterModule(IServiceCollection builder)
        {
            throw new NotImplementedException();
        }
    }
}
