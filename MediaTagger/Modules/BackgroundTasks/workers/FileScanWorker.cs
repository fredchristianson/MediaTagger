using MediaTagger.Data;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.Setting;

namespace MediaTagger.Modules.BackgroundTasks.workers
{
    public class FileScanWorker : BackgroundWorker
    {
        private ILogger<FileScanWorker> logger;
        private IBackgroundMessageService messageService;
        private IMediaFileService mediaFileService;
        private ISettingService settingService;

        public FileScanWorker(IBackgroundTaskQueue queue,
      ILogger<FileScanWorker> logger,
      IMediaFileService mediaFileService,
      ISettingService settingsService,
      IBackgroundMessageService messageService) : base(queue)
        {
            this.logger = logger;
            this.messageService = messageService;
            this.mediaFileService = mediaFileService;
            this.settingService = settingsService;
        }

        public override async void DoWork()
        {
            logger.LogInformation("FileScanWorker starting");
            DateTime lastScan = await GetLastScanTime();
            var startTime = DateTime.Now;
            var files = await ScanDirectory("x:\\photo-reorg", lastScan, Array.AsReadOnly(DefaultData.FileExtensions), TaskCancellationToken);
            int count = 0;
            foreach (var file in files)
            {
                _ = await this.mediaFileService.Process(file);
                //logger.LogDebug($"Processed {file}");
                //messageService.Add($"Processed {file}");
                count += 1;
                if ((count % 100) == 0)
                {

                    logger.LogInformation($"file scan {count} out of {files.Count}");
                }
            }
            await settingService.SetTime("FileScanWorker", "lastscantime",startTime);
            logger.LogInformation("FileScanWorker complete");
        }

        private async Task<DateTime> GetLastScanTime()
        {
            var last = await settingService.GetTime("FileScanWorker", "lastscantime");
            if (last == null)
            {
                return DateTime.MinValue;
            }
            return last.GetValueOrDefault();
        }

        protected async Task<IList<string>> ScanDirectory(string path,DateTime after, IList<string> extensions, CancellationToken stoppingToken)
        {
            List<string> result = new List<string>();
            try
            {
                var files = Directory.GetFiles(path);
                var fileMatch = files.Where(filePath =>
                {
                    var file = new FileInfo(filePath);
                    // copy/pasting a file results in old write but new create time.  so test both
                    return extensions.Contains(file.Extension.ToLower()) 
                    && (file.LastWriteTime > after || file.CreationTime > after);
                }
                );
                result.AddRange(fileMatch);

                var subDirectories = Directory.GetDirectories(path);
                foreach (string dir in subDirectories)
                {
                    if (stoppingToken.IsCancellationRequested)
                    {
                        messageService.Add("Scan canceled");
                        return result;
                    }
                    result.AddRange(await ScanDirectory(dir, after, extensions, stoppingToken));
                }
            }
            catch (Exception ex)
            {
                messageService.Add("error scanning {path}", ex);
            }

            return result;
        }
    }

}
