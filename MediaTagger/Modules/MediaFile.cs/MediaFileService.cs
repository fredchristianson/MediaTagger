using MediaTagger.Data;
using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaItem;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;

namespace MediaTagger.Modules.MediaFile
{
  public interface IMediaFileService
  {
    string GetFileMimeType(MediaFileModel file);
    string GetFilePath(MediaFileModel file);
    Task<MediaFileModel?> GetMediaFileById(int id);
    Task<MediaFileModel?> Process(string path);
  }
  public class MediaFileService : IMediaFileService
  {
    private MediaTaggerContext? db;
    private ILogger<MediaFileService> logger;
    private IPathService pathService;
    private IMediaItemService mediaItemService;

    public MediaFileService(MediaTaggerContext context, IMediaItemService mediaItemService, IPathService path, ILogger<MediaFileService> logger)
    {
      this.db = context;
      this.logger = logger;
      this.pathService = path;
      this.mediaItemService = mediaItemService;
    }

    public async Task<MediaFileModel?> GetMediaFileById(int id)
    {
      var mediaFile = await db.MediaFiles.FindAsync(id);
      return mediaFile;


    }

    public async Task<MediaFileModel?> Process(string path)
    { 
      try
      {
        
       // using (var transaction = db.Database.BeginTransaction())
        {
          var dir = Directory.GetParent(path);
          var file = new FileInfo(path);
          if (dir == null || file == null || !file.Exists)
          {
            logger.LogError($"path does not exist: {path}");
            return null;
          }
          var pathModel = await pathService.GetOrCreatePath(dir.FullName);
          if (path == null)
          {
            logger.LogError($"unable to process directory {dir.FullName}");
            return null;
          }
          var fileModel = await GetOrCreateFile(pathModel, file);
          await this.db.SaveChangesAsync();
          //   transaction.Commit();
          db.ChangeTracker.Clear();

          return fileModel;
        }
      }
      catch (Exception ex)
      {
         Console.WriteLine(ex.Message);
        return null;
      }
      finally
      {
      }

    }

    private async Task<MediaFileModel> GetOrCreateFile(PathModel pathModel, FileInfo file)
    {
      var fileModel = await db.MediaFiles.Where(f => f.Name == file.Name && f.Path == pathModel).FirstOrDefaultAsync();
      if (fileModel == null)
      {
        fileModel = await CreateFile(pathModel, file);
      }
      return fileModel;
    }

    private async Task<MediaFileModel> CreateFile(PathModel pathModel, FileInfo file)
    {
      var fileModel = new MediaFileModel();
      fileModel.Name = file.Name;
      fileModel.Created = file.CreationTime;
      fileModel.Modified = file.LastWriteTime;
      fileModel.FileSize = file.Length;
      fileModel.PathId = pathModel.PathId;

      var createdModel = await db.MediaFiles.AddAsync(fileModel);
      await this.db.SaveChangesAsync();
      fileModel.MediaItem = await mediaItemService.GetOrCreate(fileModel);
      //fileModel.MediaItem = await mediaItemService.Create(fileModel);
      return createdModel.Entity;
    }

    public string GetFilePath(MediaFileModel file)
    {

      if (file == null) {
        throw new ArgumentException();
      }
      if (file.Path == null) {
        db.Entry(file).Reference(f => f.Path).Load();
      }
      return Path.Combine(file.Path.Value, file.Name);
    }

    public string GetFileMimeType(MediaFileModel file)
    {
      return "image/jpeg";
    }
  }
}