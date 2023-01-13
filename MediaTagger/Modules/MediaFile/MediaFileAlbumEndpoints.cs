using MediaTagger.Data;
using MediaTagger.Modules.Tag;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.MediaFile
{
    public static class MediaFileAlbumEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapEndpoints(this IEndpointRouteBuilder routes)
        {


            routes.MapGet(V1_URL_PREFIX + "/MediaAlbums", async (MediaTaggerContext db, AppSettingsService settingsService, int? start, int? count) =>
                       {
                           var files = await db.MediaFiles
                           .Where(f => !f.Hidden)
                           .Include(f => f.Albums)
                           .OrderBy(f => f.Id)
                           .Skip(start ?? 0)
                           .Take(count ?? 1000)
                           .Select(f => new
                           {
                               id = f.Id,
                               albums = f.Albums.Select(t => t.Id)
                           }).ToListAsync();
                           var total = await db.MediaFiles.CountAsync();
                           return new
                           {
                               success = true,
                               message = "success",
                               start = start,
                               requestCount = count,
                               totalCount = total,
                               resultCount = files.Count(),
                               data = files
                           };
                       });

            routes.MapPut(V1_URL_PREFIX + "/MediaAlbum", async (MediaTaggerContext db, AppSettingsService settingsService, int? mediaFileId, int? tagId) =>
                    {
                        var file = await db.MediaFiles
                           .Where(f => !f.Hidden & f.Id == mediaFileId)
                           .Include(f => f.Albums)
                           .FirstAsync();
                        dynamic response = null!;
                        if (file != null)
                        {
                            var album = await db.Albums.Where(t => t.Id == tagId).FirstAsync();
                            file.Albums.Add(album);
                            await db.SaveChangesAsync();
                            response = new
                            {
                                success = true,
                                message = "created",
                                mediaTag = new
                                {
                                    mediaFileId = mediaFileId,
                                    tagId = tagId
                                }
                            };
                        }
                        else
                        {
                            response = new
                            {
                                success = false,
                                message = "file not found",
                            };
                        }
                        return response;
                    });

            routes.MapDelete(V1_URL_PREFIX + "/MediaAlbum", async (MediaTaggerContext db, AppSettingsService settingsService, int? mediaFileId, int? tagId) =>
                    {
                        var file = await db.MediaFiles
                           .Where(f => !f.Hidden & f.Id == mediaFileId)
                           .Include(f => f.Albums)
                           .FirstAsync();
                        dynamic response = null!;
                        if (file != null)
                        {
                            var tag = await db.Albums.Where(t => t.Id == tagId).FirstAsync();
                            file.Albums.Remove(tag);
                            await db.SaveChangesAsync();
                            response = new
                            {
                                success = true,
                                message = "deleted",
                                mediaTag = new
                                {
                                    mediaFileId = mediaFileId,
                                    tagId = tagId
                                }
                            };
                        }
                        else
                        {
                            response = new
                            {
                                success = false,
                                message = "file not found",
                            };
                        }
                        return response;
                    });
        }
    }
}
