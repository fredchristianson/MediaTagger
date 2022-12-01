using MediaTagger.Data;
using MediaTagger.Modules.MediaFile;

namespace MediaTagger.Modules.BackgroundTasks.workers
{
  public class FileScanWorker : BackgroundWorker
  {
    private ILogger<FileScanWorker> logger;
    private IBackgroundMessageService messageService;
        private IMediaFileService mediaFileService;

        public FileScanWorker(IBackgroundTaskQueue queue,
      ILogger<FileScanWorker> logger, 
      IMediaFileService mediaFileService,
      IBackgroundMessageService messageService) : base(queue)
    {
      this.logger = logger;
      this.messageService = messageService;
      this.mediaFileService = mediaFileService;
    }

    public override async void DoWork()
    {
      logger.LogInformation("FileScanWorker starting");
      var files = await ScanDirectory("x:\\photo-reorg", Array.AsReadOnly(DefaultData.FileExtensions), TaskCancellationToken);
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
      logger.LogInformation("FileScanWorker complete");
    }


    protected async Task<IList<string>> ScanDirectory(string path, IList<string> extensions, CancellationToken stoppingToken)
    {
      List<string> result = new List<string>();
      try
      {
        var files = Directory.GetFiles(path);
        var fileMatch = files.Where(filePath =>
        {
          var file = new FileInfo(filePath);
          return extensions.Contains(file.Extension.ToLower());
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
          result.AddRange(await ScanDirectory(dir, extensions, stoppingToken));
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
