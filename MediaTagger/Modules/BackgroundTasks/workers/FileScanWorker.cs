using MediaTagger.Data;
using MediaTagger.Modules.Image;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.Setting;

namespace MediaTagger.Modules.BackgroundTasks.Workers
{
    public class FileScanWorker : BackgroundWorker
    {
        static int nextWorkerCounter = 0;
        static int NextWorkerCounter { get { return nextWorkerCounter++; } }
        static CancellationTokenSource? currentTaskCancellationSource = null;
        private ILogger<FileScanWorker> logger;
        private MediaTaggerContext db;
        private IMediaFileService mediaFileService;
        private ISettingService settingService;
        private ThumbnailService thumbnailService;
        private AppSettings? appSettings;

        int workerCounter { get; } = NextWorkerCounter;
        public FileScanWorker(
        ILogger<FileScanWorker> logger,
        IMediaFileService mediaFileService,
        ISettingService settingsService,
        MediaTaggerContext db,
        ThumbnailService thumbnailService)
        {
            this.logger = logger;
            this.db = db;
            this.mediaFileService = mediaFileService;
            this.settingService = settingsService;
            this.thumbnailService = thumbnailService;
            if (currentTaskCancellationSource != null)
            {
                try
                {
                    currentTaskCancellationSource.Cancel();
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "failed to cancel previous worker");
                }
            }
            logger.LogDebug($"FileScanWorker {workerCounter} created");
        }

        public override async Task DoWork()
        {
            logger.LogInformation($"FileScanWorker {workerCounter} running");

            using (var cancellationSource = new CancellationTokenSource())
            {
                currentTaskCancellationSource = cancellationSource;
                var token = cancellationSource.Token;
                this.appSettings = settingService.GetAppSettings().Result;
                logger.LogInformation("FileScanWorker starting");
                DateTime lastScan = await GetLastScanTime();
                var startTime = DateTime.Now;
                List<string> dirs = this.appSettings.MediaDirectories;
                if (dirs.Count == 0)
                {
                    logger.LogInformation("No media directories to scan");
                    return;
                }
                // can't use lastScan when directory settings change.  
                // need to do a full scan after a directory is added.
                // always do full scan for now
                await FindFileChanges(/*lastScan*/ DateTime.MinValue, dirs, token);
                await GetMediaFileProperties(token);
                await CreateThumbnails(token);

                if (!TaskCancellationToken.IsCancellationRequested || !token.IsCancellationRequested)
                {
                    logger.LogDebug($"FileScanWorker {workerCounter} cancelled");

                    await settingService.SetTime("FileScanWorker", "lastscantime", startTime);
                }
                logger.LogDebug($"FileScanWorker {workerCounter} complete");

                logger.LogInformation("FileScanWorker complete");
            }
        }

        private async Task GetMediaFileProperties(CancellationToken token)
        {
            var allMediaFileIds = await this.mediaFileService.GetAllMediaFileIds();
            allMediaFileIds.Sort();
            foreach (var id in allMediaFileIds)
            {
                if (TaskCancellationToken.IsCancellationRequested || token.IsCancellationRequested)
                {
                    break;
                }
                await mediaFileService.UpdateMediaFileProperties(id);
                // iterating through all files but don't need to keep changes
                db.ChangeTracker.Clear();

            };
        }

        private async Task CreateThumbnails(CancellationToken token)
        {
            var allMediaFileIds = await this.mediaFileService.GetAllMediaFileIds();
            allMediaFileIds.Sort();
            foreach (var id in allMediaFileIds)
            {
                if (TaskCancellationToken.IsCancellationRequested || token.IsCancellationRequested)
                {
                    break;
                }
                try
                {
                    await thumbnailService.GetThumbnailFileInfo(id);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, $"Unable to create thumbnail for media file {id}");
                }
            };
        }



        private async Task FindFileChanges(DateTime lastScan, List<string> dirs, CancellationToken token)
        {
            foreach (var dir in dirs)
            {

                if (TaskCancellationToken.IsCancellationRequested || token.IsCancellationRequested)
                {
                    break;
                }
                logger.LogInformation($"Scan directory {dir}");
                if (AppSettingsService.IsAppStorageDirectory(dir))
                {
                    logger.LogInformation("ignoring MediaTagger storage directory");
                    continue;
                }
                var files = await ScanDirectory(dir, lastScan, Array.AsReadOnly(DefaultData.FileExtensions), TaskCancellationToken);
                int count = 0;
                foreach (var file in files)
                {
                    _ = await this.mediaFileService.Process(file);
                    //logger.LogDebug($"Processed {file}");
                    //messageService.Add($"Processed {file}");
                    count += 1;
                    if ((count % 100) == 0)
                    {

                        logger.LogDebug($"file scan {count} out of {files.Count}");
                    }
                }
            }
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

        protected async Task<IList<string>> ScanDirectory(string path, DateTime after, IList<string> extensions, CancellationToken stoppingToken)
        {
            List<string> result = new List<string>();
            var appSettings = await settingService.GetAppSettings();
            // don't scan the app storage directory where thumbnails and other temp files are kept
            // in case user picked a storage directory under a media directory
            if (AppSettingsService.IsAppStorageDirectory(path))
            {
                return result;
            }
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
                        return result;
                    }
                    result.AddRange(await ScanDirectory(dir, after, extensions, stoppingToken));
                }
            }
            catch (Exception ex)
            {
            }

            return result;
        }

        private string normalizePath(string path)
        {
            return path.ToUpperInvariant().Trim('\\', '/', '.');
        }

        private bool IsPathBelow(DirectoryInfo path, DirectoryInfo storageDirectory)
        {
            if (path.FullName.Equals(storageDirectory.FullName))
            {
                return true;
            }
            if (path.Parent != null)
            {
                return IsPathBelow(path.Parent, storageDirectory);
            }
            return false;
        }
    }

}
