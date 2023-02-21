using MediaTagger.Interfaces;

namespace MediaTagger.Modules.Image
{
    public class ImageModule : IModule
    {

        public ImageModule()
        {
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
