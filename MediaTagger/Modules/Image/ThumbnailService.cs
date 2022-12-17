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
                return null;
            }

            var path = fileService.GetFilePath(mediaFile);

            try
            {



                var responseStream = new MemoryStream();
                IMagickImage? img = null;
                if (false && fileService.IsVideoType(mediaFile))
                {

                    using (var videoFrames = new MagickImageCollection(path))
                    {
                        img = videoFrames.First(); //save last full frame, as initial it will be first in collection
                        if (img != null)
                        {
                            img.Thumbnail(new MagickGeometry(255, 255));
                            if (fileService.IsRawImage(mediaFile))
                            {
                                img.GammaCorrect(2.2);
                            }

                            img.Write(thumbFile, MagickFormat.WebP);
                            img.Dispose();
                            return new FileInfo(thumbFile);
                        }
                    }
                }
                else
                {
                    var readSettings = new MagickReadSettings
                    {
                        //  Format=MagickFormat.Dcraw
                    };
                    using (img = new MagickImage(path, readSettings))
                    {

                        if (img != null)
                        {

                            if (fileService.IsRawImage(mediaFile))
                            {
                                // todo: see if raw thumbnail color problems can be fixed
                                img.GammaCorrect(1.8);
                                var profile = img.GetProfile(":dng:thumbnail");
                                if (profile != null)
                                {
                                    File.WriteAllBytes(thumbFile, profile.GetData());
                                    return new FileInfo(thumbFile);
                                }
                            }
                            img.Thumbnail(new MagickGeometry(255, 255));

                            img.Write(thumbFile, MagickFormat.WebP);
                            img.Dispose();
                            return new FileInfo(thumbFile);
                        }
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
