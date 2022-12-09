using MediaTagger.Data;
using MediaTagger.Modules.Tag;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.MediaGroup
{
    public static class MediaGroupEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/MediaGroups", async (MediaTaggerContext db) =>
                  {
                      return await db.MediaGroups.ToListAsync();
                  });

        }
    }
}
