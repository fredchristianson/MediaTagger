using MediaTagger.Data;
using MediaTagger.Modules.Image;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.Setting;

namespace MediaTagger.Modules.BackgroundTasks.Workers
{
    public class CleanTempFilesWorker : BackgroundWorker
    {
        private ILogger<CleanTempFilesWorker> logger;
        private AppSettings? appSettings;

        public CleanTempFilesWorker(
        ILogger<CleanTempFilesWorker> logger,
        AppSettingsService appSettings)
        {
            this.logger = logger;
            this.appSettings = appSettings.get();
        }

        public override async Task DoWork()
        {
            logger.LogDebug($"CleanTempFilesWorker: {this.appSettings?.getTempDirectory()} ");
            var dirInfo = new DirectoryInfo(appSettings.getTempDirectory());
            CleanDirectory(dirInfo);

        }

        private void CleanDirectory(DirectoryInfo dirInfo)
        {
            try
            {
                var files = Directory.GetFiles(dirInfo.FullName);
                var subDirectories = Directory.GetDirectories(dirInfo.FullName);
                foreach (var file in files)
                {
                    try
                    {
                        var fileInfo = new FileInfo(file);
                        fileInfo.Delete();
                    }
                    catch (Exception ex)
                    {
                        logger.LogInformation(ex, $"Failed to delete file {file}");
                    }
                }
                foreach (var dir in subDirectories)
                {
                    var subdirInfo = new DirectoryInfo(dir);
                    CleanDirectory(subdirInfo);
                    try
                    {
                        subdirInfo.Delete();
                    }
                    catch (Exception ex)
                    {
                        logger.LogInformation(ex, $"Failed to delete subdirectory {dir}");
                    }
                }

            }
            catch (Exception ex)
            {
                logger.LogInformation(ex, $"failed to clean directory {dirInfo.FullName}");
            }

        }

    }

}
