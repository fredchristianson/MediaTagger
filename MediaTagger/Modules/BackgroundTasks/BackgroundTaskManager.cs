/* https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-3.1&tabs=visual-studio#queued-background-tasks */

using MediaTagger.Data;
using MediaTagger.Modules.BackgroundTasks;
using MediaTagger.Modules.MediaFile;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Threading;

namespace MediaTagger.Modules.BackgroundTasks
{
    public interface IBackgroundTaskManager : IHostedService
    {

    }

    public class BackgroundTaskManager : IBackgroundTaskManager
    {
        private IBackgroundTaskQueue queue;
        private IPeriodicWorkerRunner periodicRunner;
        private ILogger<BackgroundTaskManager> logger;
        private IServiceScopeFactory scopeFactory;

        public BackgroundTaskManager(IBackgroundTaskQueue queue, IPeriodicWorkerRunner periodicRunner, IServiceScopeFactory scopeFactory, ILogger<BackgroundTaskManager> logger)// IBackgroundMessageService messageService, IMediaFileService mediaFileService)
        {
            this.queue = queue;
            this.periodicRunner = periodicRunner;
            this.logger = logger;
            this.scopeFactory = scopeFactory;
        }


        private async Task BackgroundProcessing(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var workItem =
                    await queue.DequeueAsync(stoppingToken);

                try
                {
                    await workItem(stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex,
                        "Error occurred executing {WorkItem}.", nameof(workItem));
                }
            }
        }
        private async Task PeriodicProcessing(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var workItems =
                    await periodicRunner.GetRunnableTasks(stoppingToken);

                try
                {
                    if (!stoppingToken.IsCancellationRequested)
                    {
                        foreach (var worker in workItems)
                        {
                            try
                            {
                                worker.Run();
                            }
                            catch (Exception ex)
                            {
                                logger.LogError(ex, $"failed to execute worker {worker.GetType().Name}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex,
                        "failed to execute periodic tasks.");
                }
            }
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Task.Run(async () =>
            {
                var backgroundProcessing = BackgroundProcessing(cancellationToken);
                var periodicProcessing = PeriodicProcessing(cancellationToken);
                await Task.WhenAll(backgroundProcessing, periodicProcessing);
                return Task.CompletedTask;
            });
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            Func<CancellationToken, ValueTask>? worker = queue.TryDequeue();
            while (worker != null)
            {
                worker(cancellationToken);
                worker = queue.TryDequeue();
            }
            return Task.CompletedTask;
        }




    }

}
