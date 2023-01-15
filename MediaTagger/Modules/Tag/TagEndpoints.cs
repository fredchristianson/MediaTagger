using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Tag
{


    public static class TagEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapTagEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/Tags", async (MediaTaggerContext db, int? start, int? count) =>
                  {
                      var tags = await db.Tags
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
                          parentId = f.ParentId

                      }).ToListAsync();
                      var total = await db.Tags.CountAsync();
                      return new
                      {
                          start = start,
                          requestCount = count,
                          totalCount = total,
                          resultCount = tags.Count(),
                          data = tags
                      };
                  });



            routes.MapPut(V1_URL_PREFIX + "/Tag", async (MediaTaggerContext db, string name, int? parentId) =>
          {
              var tag = new TagModel
              {
                  CreatedOn = DateTime.Now,
                  ModifiedOn = DateTime.Now,
                  Name = name,
                  ParentId = parentId,
                  Hidden = false
              };
              await db.Tags.AddAsync(tag);
              await db.SaveChangesAsync();
              return new
              {
                  success = true,
                  message = "created",
                  data = new
                  {
                      id = tag.Id,
                      name = tag.Name,
                      parentId = tag.ParentId,
                      createdOn = tag.CreatedOn,
                      modifiedOn = tag.ModifiedOn,
                  }
              };
          });

            routes.MapPost(V1_URL_PREFIX + "/Tag", async (MediaTaggerContext db, TagModel tag) =>
            {
                var oldtag = await db.Tags.FindAsync(tag.Id);
                dynamic response = null!;
                if (oldtag == null)
                {
                    response = Results.NotFound(
                        new
                        {
                            success = false,
                            message = "not found"
                        });

                }
                else
                {
                    oldtag.ParentId = tag.ParentId;
                    oldtag.Name = tag.Name;
                    oldtag.ModifiedOn = DateTime.Now;
                    oldtag.Hidden = tag.Hidden;
                    await db.SaveChangesAsync();
                    response = new
                    {
                        success = true,
                        message = "updated",
                        data = oldtag
                    };
                }
                return response;
            });
        }
    }
}
