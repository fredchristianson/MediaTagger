using MediaTagger.Data;
using MediaTagger.Modules.FileSystem;

namespace MediaTagger.Modules.MediaFile
{
  public interface IMediaFileService
  {
    void Process(string path);
  };

  public class MediaFileService : IMediaFileService
  {
    private MediaTaggerContext db;
    private ILogger<MediaFileService> logger;
    private IPathService pathService;

    public MediaFileService(MediaTaggerContext context, IPathService path, ILogger<MediaFileService> logger)
    {
      this.db = context;
      this.logger = logger;
      this.pathService = path;
    }
    public async void Process(string path)
    {
      try
      {
        var dir = Directory.GetParent(path);
        var file = new FileInfo(path);
        if (dir == null || file == null || !file.Exists)
        {
          logger.LogError($"path does not exist: {path}");
          return;
        }
        await pathService.GetOrCreatePath(dir.FullName);
      }
      catch (Exception ex)
      {
         Console.WriteLine(ex.Message);
      }
    }
  }
}