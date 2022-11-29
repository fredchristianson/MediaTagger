using MediaTagger.Interfaces;

namespace MediaTagger.Modules.MediaItem
{
  public class MediaItemModule : IModule
  {
    public MediaItemModule() { }

    public IServiceCollection RegisterModule(IServiceCollection services)
    {
      services.AddScoped<IMediaItemService,MediaItemService>();
      return services;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      MediaItemEndpoints.MapEndpoints(endpoints);
      return endpoints;
    }


  }
}
