using ImageMagick;
using MediaTagger.Data;
using MediaTagger.Hubs;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.Setting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Image
{

    public class ThumbnailService
    {
        private IHttpContextAccessor httpContextAccessor;
        private ILogger<ThumbnailService> logger;
        private MediaTaggerContext dbContext;
        private IMediaFileService fileService;
        private AppSettingsService settingsService;

        public ThumbnailService(MediaTaggerContext db,
      IHttpContextAccessor httpContextAccessor,
      AppSettingsService settings,
      ILogger<ThumbnailService> logger, IMediaFileService fileService)
        {
            this.httpContextAccessor = httpContextAccessor;
            this.logger = logger;
            this.dbContext = db;
            this.fileService = fileService;
            this.settingsService = settings;
        }

        public string GetMimeType() { return "image/jpeg"; }

        async public Task<FileInfo> GetThumbnailFileInfo(int id)
        {
            FileInfo? path = await GetOrCreateThumbnailFile(id);
            if (path == null)
            {
                throw new FileNotFoundException();
            }
            return path;
        }

        async private Task<FileInfo?> GetOrCreateThumbnailFile(int id)
        {
            var settings = settingsService.get();
            var dir = settings.StorageDirectory;
            var bucket3 = (id / 100) % 100;
            var bucket2 = (id / 10000) % 100;
            var bucket1 = id / 100000;
            var thumbDir = Path.Combine(dir, "thumbnail", bucket1.ToString(), bucket2.ToString(), bucket3.ToString());
            var thumbFile = Path.Combine(thumbDir, id.ToString() + ".jpg");
            var fileInfo = new FileInfo(thumbFile);
            if (fileInfo.Exists)
            {
                return fileInfo;
            }
            Directory.CreateDirectory(thumbDir);


            var mediaFile = await fileService.GetMediaFileById(id);
            if (mediaFile == null)
            {
                return null;
            }

            var path = fileService.GetFilePath(mediaFile);

            try
            {

                var readSettings = new MagickReadSettings
                {
                    //  Format=MagickFormat.Dcraw
                };

                var responseStream = new MemoryStream();
                using (var img = new MagickImage(path, readSettings))
                {
                    var cs = img.ColorSpace;
                    var ct = img.ColorType;
                    var cp = img.GetColorProfile();
                    //img.TransformColorSpace(new ColorProfile())
                    img.Thumbnail(new MagickGeometry(255, 255));
                    cs = img.ColorSpace;
                    ct = img.ColorType;
                    cp = img.GetColorProfile();
                    img.Write(thumbFile, MagickFormat.Jpeg);
                    img.Dispose();
                    return new FileInfo(thumbFile);
                    //var thumb = Results.File(path, service.GetFileMimeType(file));
                    //return thumb;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "unable to convert image");
                throw;
            }

        }
    }
}
