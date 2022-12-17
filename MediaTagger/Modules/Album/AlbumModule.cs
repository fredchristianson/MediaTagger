using MediaTagger.Interfaces;

namespace MediaTagger.Modules.Album
{
    public class AlbumModule : IModule
    {
        public AlbumModule() { }

        public IServiceCollection RegisterModule(IServiceCollection services)
        {
            services.AddScoped<IAlbumService, AlbumService>();
            return services;
        }
        public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            AlbumEndpoints.MapEndpoints(endpoints);
            return endpoints;
        }


    }
}
