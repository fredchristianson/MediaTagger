using MediaTagger.Interfaces;

namespace MediaTagger.Modules.Property
{
    public class PropertyModule : IModule
    {

        public PropertyModule()
        {
        }

        public IServiceCollection RegisterModule(IServiceCollection builder)
        {
            builder.AddScoped<PropertyService>();

            return builder;
        }
        public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            PropertyEndpoints.MapPropertyEndpoints(endpoints);
            return endpoints;
        }


    }
}
