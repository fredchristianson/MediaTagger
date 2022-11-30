using MediaTagger.Hubs;
using MediaTagger.Interfaces;
using MediaTagger.Modules.Tag;
using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Modules.Setting
{
  public class TagModule : IModule
  {
        private ILogHub logHub;
        private IHubContext<ILogHub> hubContext;

        public TagModule() { 
    }

    public IServiceCollection RegisterModule(IServiceCollection builder)
    {
      //services.AddSingleton(new OrderConfig());
      return builder;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      TagEndpoints.MapTagEndpoints(endpoints);
      return endpoints;
    }


  }
}
