using MediaTagger.Data;
using MediaTagger.Modules.Tag;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.MediaItem
{
    public static class MediaItemEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/MediaItems", async (MediaTaggerContext db, AppSettingsService settingsService) =>
                  {
                      var settings = settingsService.get();
                      var files = await db.MediaFiles
                      .Include(f => f.Path)
                      .Include(f => f.MediaItem)
                      .ToListAsync();
                      // only keep ones under the current settings directories
                      var keep = files.Where(file =>
                      {
                          var dir = file.Path?.Value;
                          return settingsService.IsPathSelected(dir);
                      }).Select(f =>
                     new
                     {
                         mediaItemId = f.MediaItemId,
                         primaryFileId = f.MediaFileId,
                         dateTaken = f.DateTaken,
                         dateCreated = f.Created,
                         fileSize = f.FileSize,
                         dateModified = f.Modified,
                         name = f.MediaItem.Name,
                         path = f.Path?.Value
                     }

                      );

                      return keep.ToList();
                  });

            routes.MapGet(V1_URL_PREFIX + "/oldMediaItems", async (MediaTaggerContext db, AppSettingsService settingsService) =>
                  {
                      var items = await db.MediaItems
                      .Include(mi => mi.PrimaryFile)
                      .Include(mi => mi.PrimaryFile.Path).ToListAsync();

                      var keep = items.Where(items =>
                      {
                          var dir = items.PrimaryFile?.Path?.Value;
                          return settingsService.IsPathSelected(dir);
                      })
                      .Select(f =>
                        new
                        {
                            mediaItemId = f.MediaItemId,
                            dateCreated = f.Created,
                            dateModified = f.Modified,
                            primaryFileId = f.PrimaryFileId,
                            name = f.Name,
                            path = f.PrimaryFile.Path?.Value
                        });
                      return keep;
                  });

        }
    }
}
