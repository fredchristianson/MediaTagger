using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Album
{
    public static class AlbumEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/Albums", async (MediaTaggerContext db, int? start, int? count) =>
                  {
                      var albums = await db.Albums
                      .Where(f => !f.Hidden)
                      .OrderBy(f => f.Id)
                      .Skip(start ?? 0)
                      .Take(count ?? 1000)
                      .Select(f => new
                      {
                          id = f.Id,
                          createdOn = f.CreatedOn,
                          modifiedOn = f.ModifiedOn,
                          name = f.Name,

                      }).ToListAsync();
                      var total = await db.Albums.CountAsync();
                      return new
                      {
                          start = start,
                          requestCount = count,
                          totalCount = total,
                          resultCount = albums.Count(),
                          data = albums
                      };
                  });

        }
    }
}
