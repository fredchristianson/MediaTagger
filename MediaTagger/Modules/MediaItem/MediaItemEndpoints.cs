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

            routes.MapGet(V1_URL_PREFIX + "/MediaItems", async (MediaTaggerContext db) =>
                  {
                      return await db.MediaItems.Select(f =>
                        new
                            {
                                mediaId = f.MediaItemId,
                                dateCreated = f.Created,
                                dateModified = f.Modified,
                                primaryFileId = f.PrimaryFileId,
                                name = f.Name
                            }).ToListAsync();
                  });

        }
    }
}
