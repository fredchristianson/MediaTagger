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
  public interface IBackgroundTaskManager : IHostedService { }

  public class BackgroundTaskManager : BackgroundService, IBackgroundTaskManager
  {
    private IBackgroundTaskQueue queue;
    private ILogger<BackgroundTaskManager> logger;

    public BackgroundTaskManager(IBackgroundTaskQueue queue, ILogger<BackgroundTaskManager> logger)// IBackgroundMessageService messageService, IMediaFileService mediaFileService)
    {
      this.queue = queue;
      this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {

      await BackgroundProcessing(stoppingToken);
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

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
      logger.LogInformation("Queued Hosted Service is stopping.");

      await base.StopAsync(stoppingToken);
    }
  }
}
