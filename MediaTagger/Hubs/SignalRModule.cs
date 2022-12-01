using MediaTagger.Interfaces;

namespace MediaTagger.Hubs
{
    public class SignalRModule : IModule
    {
        public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
        {
      endpoints.MapHub<LogHub>("/hub/log");
      endpoints.MapHub<ImageHub>("/hub/image");
      return endpoints;
        }

        public IServiceCollection RegisterModule(IServiceCollection builder)
        {
      builder.AddSignalR();
      return builder;
        }
    }
}
