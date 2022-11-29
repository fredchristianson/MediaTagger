using MediaTagger.Interfaces;

namespace MediaTagger.Modules.MediaFile
{
  public class MediaFileModule : IModule
  {
    public MediaFileModule() { }

    public IServiceCollection RegisterModule(IServiceCollection services)
    {
      services.AddScoped<IMediaFileService, MediaFileService>();
      return services;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      MediaFileEndpoints.MapEndpoints(endpoints);
      return endpoints;
    }


  }
}
