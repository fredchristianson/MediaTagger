/* https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-3.1&tabs=visual-studio#queued-background-tasks */

using System.Threading.Channels;

namespace MediaTagger.Modules.BackgroundTasks
{
    public interface IBackgroundTaskQueue
    {
        ValueTask QueueBackgroundWorkItemAsync(Func<CancellationToken, ValueTask> workItem);

        ValueTask<Func<CancellationToken, ValueTask>> DequeueAsync(
            CancellationToken cancellationToken);
        Func<CancellationToken, ValueTask>? TryDequeue();
        Task<BackgroundWorker> CreateWorker<T>(CancellationToken? cancellationToken = null) where T : BackgroundWorker;

    }

    public class BackgroundTaskQueue : IBackgroundTaskQueue
    {
        private readonly Channel<Func<CancellationToken, ValueTask>> _queue;
        private readonly IServiceScopeFactory scopeFactory;

        public BackgroundTaskQueue(IServiceScopeFactory scopeFactory)
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
            this.scopeFactory = scopeFactory;

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

        public Func<CancellationToken, ValueTask>? TryDequeue()
        {
            Func<CancellationToken, ValueTask>? item = null;

            _queue.Reader.TryRead(out item);

            return item;
        }

        public async Task<BackgroundWorker> CreateWorker<T>(CancellationToken? cancellationToken = null) where T : BackgroundWorker
        {
            var scope = scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<T>();
            service.Scope = scope;
            await QueueBackgroundWorkItemAsync(async (cancelationToken) =>
                {
                    try
                    {
                        if (!cancelationToken.IsCancellationRequested)
                        {
                            service.TaskCancellationToken = cancelationToken;
                            await service.DoWork();
                        }
                    }
                    finally
                    {
                        scope?.Dispose();
                    }

                });
            return service;
        }

    }
}
