namespace MediaTagger.Modules.BackgroundTasks
{
    public interface IBackgroundWorker
    {
    void DoWork();
    }

  public abstract class BackgroundWorker : IBackgroundWorker
  {
    protected CancellationToken TaskCancellationToken { get; set; }
    public BackgroundWorker(IBackgroundTaskQueue queue)
    {
      TaskCancellationToken = new CancellationToken();

      queue.QueueBackgroundWorkItemAsync((cancelationToken) =>
      {
        TaskCancellationToken = cancelationToken;
        DoWork();
        return ValueTask.CompletedTask;
      });
    }

    
    public abstract void DoWork();
    }
}
