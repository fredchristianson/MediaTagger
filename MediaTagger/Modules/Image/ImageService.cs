using MediaTagger.Data;
using MediaTagger.Modules.MediaFile;

namespace MediaTagger.Modules.Image
{

    public class ImageService
    {
        private IHttpContextAccessor httpContextAccessor;
        private ILogger<ImageService> logger;
        private MediaTaggerContext dbContext;
        private IMediaFileService fileService;

        public ImageService(MediaTaggerContext db,
          IHttpContextAccessor httpContextAccessor,
          ILogger<ImageService> logger, IMediaFileService fileService)
        {
            this.httpContextAccessor = httpContextAccessor;
            this.logger = logger;
            this.dbContext = db;
            this.fileService = fileService;
        }


    }
}
