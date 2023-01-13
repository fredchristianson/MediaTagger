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
                          description = f.Description
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



            routes.MapPut(V1_URL_PREFIX + "/Album", async (MediaTaggerContext db, AlbumModel album) =>
              {
                  var nameExists = await db.Albums.Where(a => a.Name == album.Name).FirstOrDefaultAsync();
                  dynamic response = null!;
                  if (nameExists != null)
                  {
                      response = new
                      {
                          success = false,
                          message = "Album already exists with name '" + album.Name + "'"
                      };
                  }
                  else
                  {
                      album.CreatedOn = DateTime.Now;
                      album.ModifiedOn = album.CreatedOn;
                      await db.Albums.AddAsync(album);
                      await db.SaveChangesAsync();
                      response = new
                      {
                          success = true,
                          message = "created",
                          data = album
                      };
                  }
                  return response;
              });

            routes.MapPost(V1_URL_PREFIX + "/Album/{name}", async (MediaTaggerContext db, AlbumModel album) =>
            {
                var oldAlbum = await db.Albums.FindAsync(album.Id);
                dynamic response = null!;
                if (oldAlbum == null)
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
                    oldAlbum.ModifiedOn = DateTime.Now;
                    oldAlbum.Name = album.Name;
                    await db.Albums.AddAsync(album);
                    await db.SaveChangesAsync();
                    response = new
                    {
                        success = true,
                        message = "updated",
                        data = oldAlbum
                    };
                }
                return response;
            });
        }
    }
}