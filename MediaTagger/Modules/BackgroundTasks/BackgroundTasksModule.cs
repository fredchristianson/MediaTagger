﻿using MediaTagger.Interfaces;
using MediaTagger.Modules.BackgroundTasks.workers;

namespace MediaTagger.Modules.BackgroundTasks
{
  public class BackgroundTasks: IModule
  {
    public BackgroundTasks() { }

    public IServiceCollection RegisterModule(IServiceCollection services)
    {
      services.AddScoped<FileScanWorker>();
      return services;
    }
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
      return endpoints;
    }


  }
}