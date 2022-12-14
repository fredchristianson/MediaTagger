using MediaTagger.Data;
using MediaTagger.Modules.Tag;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.MediaFile
{
    public static class MediaFileEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/MediaFiles", async (MediaTaggerContext db) =>
                  {
                      return await db.MediaFiles
                      .Select(f =>
                      new
                      {
                          mediaId = f.MediaItemId,
                          dateTaken = f.DateTaken,
                          dateCreated = f.Created,
                          fileSize = f.FileSize,
                          dateModified = f.Modified,
                          mediaFileId = f.MediaFileId,
                          name = f.Name
                      }).ToListAsync();
                  });

        }
    }
}
