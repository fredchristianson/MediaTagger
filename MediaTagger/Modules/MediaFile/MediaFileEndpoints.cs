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

            routes.MapGet(V1_URL_PREFIX + "/MediaFiles", async (MediaTaggerContext db, AppSettingsService settingsService, int? start, int? count) =>
                      {
                          var files = await db.MediaFiles
                          .Include(f => f.Directory)
                          .OrderBy(f => f.Id)
                          .Skip(start ?? 0)
                          .Take(count ?? 1000)
                          .Select(f => new
                          {
                              id = f.Id,
                              fileSetPrimaryId = f.fileSetPrimaryId,
                              createdOn = f.CreatedOn,
                              f.ModifiedOn,
                              f.Name,
                              directory = f.Directory == null ? null : f.Directory.Value
                          }).ToListAsync();
                          var total = await db.MediaFiles.CountAsync();
                          return new
                          {
                              start = start,
                              requestCount = count,
                              totalCount = total,
                              resultCount = files.Count(),
                              data = files
                          };
                      });



        }
    }
}
