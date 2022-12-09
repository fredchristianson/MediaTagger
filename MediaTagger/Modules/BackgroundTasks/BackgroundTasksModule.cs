using MediaTagger.Interfaces;
using MediaTagger.Modules.BackgroundTasks.Workers;

namespace MediaTagger.Modules.BackgroundTasks
{
    public class BackgroundTasks : IModule
    {
        public BackgroundTasks() { }

        public IServiceCollection RegisterModule(IServiceCollection services)
        {
            services.AddScoped<FileScanWorker>();
            services.AddScoped<CleanTempFilesWorker>();
            return services;
        }
        public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            return endpoints;
        }


    }
}
