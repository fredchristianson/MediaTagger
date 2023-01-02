using MediaTagger.Data;
using MediaTagger.Modules.Image;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.Setting;

namespace MediaTagger.Modules.BackgroundTasks.workers
{
    public class TestWorker : BackgroundWorker
    {
        private ILogger<TestWorker> logger;
        private AppSettings appSettings;

        public TestWorker(
        ILogger<TestWorker> logger,
        AppSettingsService appSettings)
        {
            this.logger = logger;
            this.appSettings = appSettings.get();
        }

        public override Task DoWork()
        {
            logger.LogDebug($"TestWorker: {this.appSettings?.getTempDirectory()} ");
            return Task.CompletedTask;
        }


    }

}
