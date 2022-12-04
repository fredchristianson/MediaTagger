using MediaTagger.Interfaces;

namespace MediaTagger.Modules.FileSystem
{
  public class PathModule: IModule
  {
    public PathModule() { }

    public IServiceCollection RegisterModule(IServiceCollection services)
    {
      services.AddScoped<IPathService, PathService>();
      services.AddScoped<IFileSystemService, FileSystemService>();
      return services;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      FileSystemEndpoints.MapEndpoints(endpoints);

      return endpoints;
    }


  }
}
