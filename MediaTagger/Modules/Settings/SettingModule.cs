using MediaTagger.Interfaces;

namespace MediaTagger.Modules.Setting
{
  public class SettingModule : IModule
  {
    public SettingModule() { }

    public IServiceCollection RegisterModule(IServiceCollection services)
    {
      services.AddScoped<ISettingService,SettingService>();
      return services;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      SettingsEndpoints.MapEndpoints(endpoints);
      return endpoints;
    }


  }
}
