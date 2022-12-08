/* https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-3.1&tabs=visual-studio#queued-background-tasks */

using System.Threading.Channels;

namespace MediaTagger.Modules.BackgroundTasks
{

    public interface IScheduledWorker
    {
        public bool ShouldRun();
        public void Run();
    }
    public interface IPeriodicWorkerRunner
    {
        ScheduledWorker<T> ScheduleWorker<T>(int frequencySeconds, int maxIterations = int.MaxValue) where T : BackgroundWorker;
        internal Task<List<IScheduledWorker>> GetRunnableTasks(CancellationToken cancel);
    }

    public class ScheduledWorker<T> : IScheduledWorker where T : BackgroundWorker
    {
        private IServiceScopeFactory? scopeFactory;
        private DateTime lastRun;
        private int frequencySeconds;
        private int iterations;
        private int runCount = 0;

        public ScheduledWorker(int frequencySeconds, IServiceScopeFactory scopeFactory, int iterations)
        {
            this.scopeFactory = scopeFactory;
            this.lastRun = DateTime.MinValue;
            this.frequencySeconds = frequencySeconds;
            this.iterations = iterations;
        }


        public bool ShouldRun()
        {
            if (iterations > 0 && runCount >= iterations)
            {
                return false;
            }
            var now = DateTime.Now;
            var diff = now - this.lastRun;
            return (diff.Seconds > this.frequencySeconds);
        }

        public async void Run()
        {
            using (var scope = this.scopeFactory.CreateScope())
            {
                var task = scope.ServiceProvider.GetRequiredService<T>();
                task.Scope = scope;
                this.lastRun = DateTime.Now;
                runCount += 1;
                await task.DoWork();
            }
        }
    }

    public class PeriodicWorkerRunner : IPeriodicWorkerRunner
    {
        private readonly ILogger<PeriodicWorkerRunner> logger;
        private readonly IServiceScopeFactory scopeFactory;
        private List<IScheduledWorker> scheduledWorkers = new List<IScheduledWorker>();

        public PeriodicWorkerRunner(IServiceScopeFactory scopeFactory, ILogger<PeriodicWorkerRunner> logger)
        {
            this.logger = logger;
            this.scopeFactory = scopeFactory;

        }

        public ScheduledWorker<T> ScheduleWorker<T>(int frequencySeconds, int iterations = int.MaxValue) where T : BackgroundWorker
        {
            var scheduledWorker = new ScheduledWorker<T>(frequencySeconds, scopeFactory, iterations);
            scheduledWorkers.Add(scheduledWorker);
            return scheduledWorker;
        }

        public async Task<List<IScheduledWorker>> GetRunnableTasks(CancellationToken cancel)
        {
            List<IScheduledWorker> list = scheduledWorkers.FindAll(schedule => schedule.ShouldRun());
            while (!cancel.IsCancellationRequested && list.Count == 0)
            {
                await Task.Delay(1000, cancel);
                list = scheduledWorkers.FindAll(schedule => schedule.ShouldRun());
            }
            return list;
        }

    }
}
