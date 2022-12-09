using ImageMagick;
using MediaTagger.Data;
using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaItem;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Linq;
using System.Net.Http.Headers;
using System.Text.Json;

namespace MediaTagger.Modules.MediaFile
{
    public interface IMediaFileService
    {
        string GetFileMimeType(MediaFileModel file);
        string GetFilePath(MediaFileModel file);
        Task<MediaFileModel?> GetMediaFileById(int id);
        Task<MediaFileModel?> Process(string path);
        public bool IsWebImageType(MediaFileModel file);
        public Task<List<int>> GetAllMediaFileIds();
        Task UpdateMediaFileProperties(int id);
        bool IsVideoType(MediaFileModel mediaFile);
        bool IsRawImage(MediaFileModel mediaFile);
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
            var mediaFile = await db.MediaFiles
            .Include(e => e.Path)
            .FirstAsync(mf => mf.MediaFileId == id);
            return mediaFile;


        }

        public async Task<List<int>> GetAllMediaFileIds()
        {
            var ids = db.MediaFiles.Select(f => f.MediaFileId);
            return ids.ToList();
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
            fileModel.DateTaken = null;
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

            if (file == null)
            {
                throw new ArgumentException();
            }
            if (file.Path == null)
            {
                db.Entry(file).Reference(f => f.Path).Load();
            }
            return Path.Combine(file.Path.Value, file.Name);
        }

        public string GetFileMimeType(MediaFileModel file)
        {
            return "image/jpeg";
        }

        public bool IsWebImageType(MediaFileModel file)
        {
            var name = file.Name.ToLower();
            return name.Contains("gif")
            || name.Contains("jpg")
            || name.Contains("jpeg")
            || name.Contains("png");

        }

        public bool IsVideoType(MediaFileModel mediaFile)
        {
            var name = mediaFile.Name.ToLower();
            return name.Contains(".mov")
            || name.Contains(".mp4");

        }

        public bool IsRawImage(MediaFileModel mediaFile)
        {
            return mediaFile.Name.ToLower().EndsWith(".rw2");
        }

        public async Task UpdateMediaFileProperties(int id)
        {
            var fileModel = await this.db.MediaFiles.FindAsync(id);
            if (fileModel != null)
            {
                if (fileModel.ExifJson != null)
                {
                    return;
                }

                var path = this.GetFilePath(fileModel);
                // don't do anything for videos yet;  
                // todo: get video properties
                if (IsVideoType(fileModel)) { return; }
                using (var image = new MagickImage(path))
                {

                    IExifProfile exifProfile = image.GetExifProfile();
                    if (exifProfile != null)
                    {
                        List<Tuple<string, object>> exifValues = new List<Tuple<string, object>>();
                        var dateTaken = exifProfile.GetValue(ExifTag.DateTimeOriginal);
                        if (dateTaken != null)
                        {
                            fileModel.DateTaken = ParseExifDate(dateTaken.Value);
                        }
                        foreach (IExifValue v in exifProfile.Values)
                        {
                            var value = v.GetValue();
                            // ignore long string values
                            if (value != null && !(value is byte[]))
                            {
                                exifValues.Add(new Tuple<string, object>(v.Tag.ToString(), value));
                            }

                        }
                        string json = JsonSerializer.Serialize(exifValues);
                        if (json != null && !json.Equals(fileModel.ExifJson))
                        {
                            fileModel.ExifJson = json;
                        }
                    }
                }

                await this.db.SaveChangesAsync();

            }
        }

        private DateTime? ParseExifDate(string? date)
        {
            if (date == null)
            {
                return null;
            }
            try
            {
                DateTime result = DateTime.MinValue;
                if (DateTime.TryParseExact(date, "yyyy:MM:dd HH:mm:ss", CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeLocal | DateTimeStyles.AllowWhiteSpaces, out result))
                {
                    return result;
                }

                return result;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"invalid DateTime {date}");
            }
            return null;
        }
    }
}