using MediaTagger.Interfaces;
using MediaTagger.Modules.Settings;

namespace MediaTagger.Modules.Setting
{
  public class SettingModule : IModule
  {
    public SettingModule() { }

    public IServiceCollection RegisterModule(IServiceCollection services)
    {
      //services.AddSingleton(new OrderConfig());
      return services;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      SettingsEndpoints.MapTagEndpoints(endpoints);
      return endpoints;
    }


  }
}
