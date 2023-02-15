using ImageMagick;
using MediaTagger.Data;
using MediaTagger.Modules.MediaFile;

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

        public string GetMimeType() { return "image/webp"; }

        async public Task<FileInfo> GetThumbnailFileInfo(long id)
        {
            FileInfo? path = await GetOrCreateThumbnailFile(id);
            if (path == null)
            {
                throw new FileNotFoundException();
            }
            return path;
        }



        async private Task<FileInfo?> GetOrCreateThumbnailFile(long id)
        {
            var settings = settingsService.get();
            var dir = settings.StorageDirectory;
            var bucket3 = (id / 100) % 100;
            var bucket2 = (id / 10000) % 100;
            var bucket1 = id / 100000;
            var thumbDir = Path.Combine(dir, "thumbnail", bucket1.ToString(), bucket2.ToString(), bucket3.ToString());
            Directory.CreateDirectory(thumbDir);
            var thumbFile = Path.Combine(thumbDir, id.ToString() + ".webp");
            var fileInfo = new FileInfo(thumbFile);
            if (fileInfo.Exists)
            {
                return fileInfo;
            }
            Directory.CreateDirectory(thumbDir);


            var mediaFile = await fileService.GetMediaFileById(id);
            if (mediaFile == null)
            {
                logger.LogError($"MediaFileModel does not exist for {id}");
                return null;
            }

            var path = fileService.GetFilePath(mediaFile);

            try
            {



                var responseStream = new MemoryStream();

                using (var img = new MagickImage()) //path))
                {
                    img.Read(path);
                    if (img != null)
                    {

                        if (fileService.IsRawImage(mediaFile))
                        {
                            // todo: see if raw thumbnail color problems can be fixed
                            img.GammaCorrect(1.8);
                            var profile = img.GetProfile(":dng:thumbnail");
                            if (profile != null)
                            {
                                var data = profile.GetData();
                                if (data != null)
                                {
                                    File.WriteAllBytes(thumbFile, data);
                                    return new FileInfo(thumbFile);
                                }
                                else
                                {
                                    return null;
                                }
                            }
                        }
                        img.AutoOrient();
                        img.Thumbnail(new MagickGeometry(255, 255));

                        img.Write(thumbFile, MagickFormat.WebP);
                        img.Dispose();
                        return new FileInfo(thumbFile);
                    }
                }

                return null;

            }
            catch (Exception ex)
            {
                logger.LogError(ex, "unable to convert image");
                throw;
            }

        }
    }
}
