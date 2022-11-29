﻿/* https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-3.1&tabs=visual-studio#queued-background-tasks */

using System.Threading.Channels;

namespace MediaTagger.Modules.BackgroundTasks
{
  public interface IBackgroundTaskQueue
  {
    ValueTask QueueBackgroundWorkItemAsync(Func<CancellationToken, ValueTask> workItem);

    ValueTask<Func<CancellationToken, ValueTask>> DequeueAsync(
        CancellationToken cancellationToken);
  }

  public class BackgroundTaskQueue : IBackgroundTaskQueue
  {
    private readonly Channel<Func<CancellationToken, ValueTask>> _queue;

    public BackgroundTaskQueue()
    {
      // Capacity should be set based on the expected application load and
      // number of concurrent threads accessing the queue.            
      // BoundedChannelFullMode.Wait will cause calls to WriteAsync() to return a task,
      // which completes only when space became available. This leads to backpressure,
      // in case too many publishers/calls start accumulating.
      var options = new BoundedChannelOptions(100)
      {
        FullMode = BoundedChannelFullMode.Wait
      };
      _queue = Channel.CreateBounded<Func<CancellationToken, ValueTask>>(options);
    }

    public async ValueTask QueueBackgroundWorkItemAsync(
        Func<CancellationToken, ValueTask> workItem)
    {
      if (workItem == null)
      {
        throw new ArgumentNullException(nameof(workItem));
      }

      await _queue.Writer.WriteAsync(workItem);
    }

    public async ValueTask<Func<CancellationToken, ValueTask>> DequeueAsync(
        CancellationToken cancellationToken)
    {
      var workItem = await _queue.Reader.ReadAsync(cancellationToken);

      return workItem;
    }
  }
}