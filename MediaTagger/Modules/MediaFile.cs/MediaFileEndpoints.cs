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

            routes.MapGet(V1_URL_PREFIX + "/MediaFiles", async (MediaTaggerContext db, AppSettingsService settingsService) =>
                  {
                      var settings = settingsService.get();
                      var files = await db.MediaFiles.Include(f => f.Path).ToListAsync();
                      // only keep ones under the current settings directories
                      var keep = files.Where(file =>
                      {
                          var dir = file.Path?.Value;
                          return settingsService.IsPathSelected(dir);
                      }).Select(f =>
                     new
                     {
                         mediaFileId = f.MediaFileId,
                         mediaItemId = f.MediaItemId,
                         dateTaken = f.DateTaken,
                         dateCreated = f.Created,
                         fileSize = f.FileSize,
                         dateModified = f.Modified,
                         name = f.Name,
                         path = f.Path?.Value
                     }

                      );

                      return keep.ToList();
                  });

        }
    }
}
