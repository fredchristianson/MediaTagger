using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MediaTagger.Modules.MediaFile;
using System.Net;
using System.Net.Http.Headers;
using System.IO;
using ImageMagick;

namespace MediaTagger.Modules.Image
{


    public static class ImageEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapTagEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet("/image/{id}", async (IMediaFileService service, int id) =>
            {
                var file = await service.GetMediaFileById(id);
                if (file == null)
                {
                    return Results.NotFound();
                }
                var path = service.GetFilePath(file);
                return Results.File(path, service.GetFileMimeType(file));

            });




            routes.MapGet("/thumbnail/{id}", async (ThumbnailService service, IMediaFileService mediaService, ILogger<ImageService> logger, int id) =>
            {
                try
                {
                    var fileInfo = await service.GetThumbnailFileInfo(id);
                    return Results.Stream(fileInfo.OpenRead(), service.GetMimeType());
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "unable to get thumbnail image");
                    //return Results.NoContent();
                    var file = await mediaService.GetMediaFileById(id);
                    if (file != null)
                    {
                        var video = mediaService.IsVideoType(file);
                        if (video)
                        {
                            return Results.LocalRedirect("~/image/video.png");
                        }
                    }
                    return Results.LocalRedirect("~/image/error.png");

                }
            });
        }

    }
}
