using MediaTagger.Interfaces;
using MediaTagger.Modules.Tag;
using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Modules.Setting
{
  public class TagModule : IModule
  {

        public TagModule() { 
    }

    public IServiceCollection RegisterModule(IServiceCollection builder)
    {
      builder.AddScoped<TagService>();

      return builder;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      TagEndpoints.MapTagEndpoints(endpoints);
      return endpoints;
    }


  }
}
