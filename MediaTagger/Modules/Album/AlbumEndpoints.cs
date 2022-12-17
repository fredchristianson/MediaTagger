using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Album
{
    public static class AlbumEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/Albums", async (MediaTaggerContext db) =>
                  {
                      return await db.Albums.ToListAsync();
                  });

        }
    }
}
