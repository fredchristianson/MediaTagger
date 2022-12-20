using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Property
{


    public static class PropertyEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapPropertyEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/Properties", async (MediaTaggerContext db, int? start, int? count) =>
                  {
                      var properties = await db.Properties
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
                      var total = await db.Properties.CountAsync();
                      return new
                      {
                          start = start,
                          requestCount = count,
                          totalCount = total,
                          resultCount = properties.Count(),
                          data = properties
                      };
                  });

            routes.MapGet(V1_URL_PREFIX + "/PropertyValues", async (MediaTaggerContext db, int? start, int? count) =>
            {
                var propertyValues = await db.PropertyValues
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
                    propertyId = f.PropertyId
                }).ToListAsync();
                var total = await db.PropertyValues.CountAsync();
                return new
                {
                    start = start,
                    requestCount = count,
                    totalCount = total,
                    resultCount = propertyValues.Count(),
                    data = propertyValues
                };
            });


        }
    }
}
