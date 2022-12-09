using MediaTagger.Interfaces;

namespace MediaTagger.Modules.MediaGroup
{
  public class MediaGroupModule : IModule
  {
    public MediaGroupModule() { }

    public IServiceCollection RegisterModule(IServiceCollection services)
    {
      services.AddScoped<IMediaGroupService,MediaGroupService>();
      return services;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      MediaGroupEndpoints.MapEndpoints(endpoints);
      return endpoints;
    }


  }
}
