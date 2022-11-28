using MediaTagger.Interfaces;
using MediaTagger.Modules.Tag;

namespace MediaTagger.Modules.Setting
{
  public class TagModule : IModule
  {
    public TagModule() { }

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
