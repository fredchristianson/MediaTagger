namespace MediaTagger.Modules.BackgroundTasks
{
    public interface IBackgroundWorker
    {
        Task DoWork();

    }

    public abstract class BackgroundWorker : IBackgroundWorker
    {
        internal IServiceScope? Scope { get; set; } = null;
        internal CancellationToken TaskCancellationToken { get; set; }

        public BackgroundWorker()
        {

        }


        public abstract Task DoWork();
    }


}

