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

            routes.MapGet(V1_URL_PREFIX + "/MediaFiles", async (ILogger<MediaFileModule> logger, MediaTaggerContext db, AppSettingsService settingsService, int? start, int? count) =>
            {
                try
                {
                    var files = await db.MediaFiles
                    .Where(f => !f.Hidden)
                    .Include(f => f.Directory)
                    .OrderBy(f => f.Id)
                    .Skip(start ?? 0)
                    .Take(count ?? 1000)
                    .Select(f => new
                    {
                        id = f.Id,
                        fileSetPrimaryId = f.FileSetPrimaryId,
                        createdOn = f.CreatedOn,
                        modifiedOn = f.ModifiedOn,
                        name = f.Name,
                        filename = f.Filename,
                        fileCreatedOn = f.FileCreated,
                        fileModifiedOn = f.FileModified,
                        directory = f.Directory == null ? null : f.Directory.Value,
                        fileSize = f.FileSize,
                        width = f.Width,
                        height = f.Height,
                        hidden = f.Hidden,
                        rotationDegrees = f.RotationDegrees
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
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "failed to load files");
                    throw;
                }
            });

            routes.MapPost(V1_URL_PREFIX + "/MediaFile", async (MediaTaggerContext db,
            AppSettingsService settingsService,
            MediaFileModel data) =>
                       {
                           var file = await db.MediaFiles
                          .Where(f => f.Id == data.Id).FirstAsync();
                           dynamic response = new { success = false };
                           if (file == null)
                           {
                               response = new
                               {
                                   success = false,
                                   message = "not found",
                                   id = data.Id
                               };
                           }
                           else
                           {
                               file.FileSetPrimaryId = data.FileSetPrimaryId;
                               file.DateTaken = data.DateTaken;
                               file.Name = data.Name;
                               file.Hidden = data.Hidden;
                               file.RotationDegrees = data.RotationDegrees;
                               file.ModifiedOn = DateTime.Now;
                               await db.SaveChangesAsync();
                               response = new
                               {
                                   success = true,
                                   message = "updated",
                                   id = file.Id
                               };
                           }

                           return response;
                       });

            routes.MapGet(V1_URL_PREFIX + "/MediaTags", async (MediaTaggerContext db, AppSettingsService settingsService, int? start, int? count) =>
                       {
                           var files = await db.MediaFiles
                           .Where(f => !f.Hidden)
                           .Include(f => f.Tags)
                           .OrderBy(f => f.Id)
                           .Skip(start ?? 0)
                           .Take(count ?? 1000)
                           .Select(f => new
                           {
                               id = f.Id,
                               tags = f.Tags.Select(t => t.Id)
                           }).ToListAsync();
                           var total = await db.MediaFiles.Where(f => !f.Hidden).CountAsync();
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

            routes.MapPut(V1_URL_PREFIX + "/MediaTag", async (ILogger<MediaFileModule> logger, MediaTaggerContext db, AppSettingsService settingsService, int? mediaFileId, int? tagId) =>
                    {
                        var file = await db.MediaFiles
                           .Where(f => !f.Hidden & f.Id == mediaFileId)
                           .Include(f => f.Tags)
                           .FirstAsync();
                        dynamic response = null!;
                        if (file != null)
                        {
                            file.ModifiedOn = DateTime.Now;
                            var tag = await db.Tags.Where(t => t.Id == tagId).FirstAsync();
                            file.Tags.Add(tag);
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
                            logger.LogInformation($"Added tag {tagId} to file {mediaFileId}");
                        }
                        else
                        {
                            logger.LogError("file not found adding tag to file");

                            response = new
                            {
                                success = false,
                                message = "file not found",
                            };
                        }
                        return response;
                    });

            routes.MapDelete(V1_URL_PREFIX + "/MediaTag", async (ILogger<MediaFileModule> logger, MediaTaggerContext db, AppSettingsService settingsService, int? mediaFileId, int? tagId) =>
                    {
                        var file = await db.MediaFiles
                           .Where(f => !f.Hidden & f.Id == mediaFileId)
                           .Include(f => f.Tags)
                           .FirstAsync();
                        dynamic response = null!;
                        if (file != null)
                        {
                            var tag = await db.Tags.Where(t => t.Id == tagId).FirstAsync();
                            file.Tags.Remove(tag);
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
                            logger.LogInformation($"Reemoved tag {tagId} from file {mediaFileId}");

                        }
                        else
                        {
                            logger.LogError("file not found adding tag to file");
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
