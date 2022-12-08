using MediaTagger.Interfaces;
using MediaTagger.Modules.Tag;
using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Modules.Image
{
  public class Image3odule : IModule
  {

        public Image3odule() { 
    }

    public IServiceCollection RegisterModule(IServiceCollection builder)
    {
      builder.AddScoped<ImageService>();
      builder.AddScoped<ThumbnailService>();

      return builder;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      ImageEndpoints.MapTagEndpoints(endpoints);
      return endpoints;
    }


  }
}
