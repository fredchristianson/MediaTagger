﻿using MediaTagger.Modules.MediaFile;
using ImageMagick;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace MediaTagger.Modules.Image
{


    public static class ImageEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapTagEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet("/image/{id}", async (IMediaFileService service,
            int id,
            [FromHeader(Name = "If-None-Match")] string? ifNotMatch,
            IHttpContextAccessor context) =>
            {
                IResult response = null!;
                response = Results.StatusCode(StatusCodes.Status404NotFound);
                var file = await service.GetMediaFileById(id);
                if (file != null)
                {
                    var path = service.GetFilePath(file);

                    var etag = '\"' + file.ModifiedOn.Ticks.ToString() + '\"';
                    if (ifNotMatch == etag)
                    {
                        response = Results.StatusCode(StatusCodes.Status304NotModified);
                    }
                    else
                    {

                        using (var img = new MagickImage(path))
                        {
                            img.AutoOrient();
                            img.Rotate(file.RotationDegrees);
                            MemoryStream stream = new MemoryStream();
                            img.Write(stream, MagickFormat.Jpeg);
                            stream.Seek(0, SeekOrigin.Begin);
                            context.HttpContext.Response.Headers.Add("cache-control", "no-cache");
                            response = Results.Stream(stream, "image/jpeg", null, file.ModifiedOn, new EntityTagHeaderValue(etag));

                        }
                    }
                }
                return response;


            });




            routes.MapGet("/thumbnail/{id}", async (ThumbnailService service, IMediaFileService mediaService, ILogger<ImageService> logger, int id,
                [FromHeader(Name = "If-None-Match")] string? ifNotMatch, IHttpContextAccessor context) =>
            {
                try
                {
                    var fileInfo = await service.GetThumbnailFileInfo(id);
                    var etag = '\"' + fileInfo.LastWriteTime.Ticks.ToString() + '\"';
                    if (ifNotMatch == etag)
                    {
                        return Results.StatusCode(StatusCodes.Status304NotModified);
                    }
                    else
                    {
                        using (var img = new MagickImage(fileInfo.FullName))
                        {
                            img.AutoOrient();
                            var file = await mediaService.GetMediaFileById(id);
                            if (file.RotationDegrees != 0)
                            {
                                img.Rotate(file.RotationDegrees);
                            }
                            MemoryStream stream = new MemoryStream();
                            img.Write(stream, MagickFormat.Jpeg);
                            stream.Seek(0, SeekOrigin.Begin);
                            context.HttpContext.Response.Headers.Add("cache-control", "no-cache");
                            return Results.Stream(stream, "image/jpeg", null, file.ModifiedOn, new EntityTagHeaderValue(etag));

                        }
                    }
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

            routes.MapPost(V1_URL_PREFIX + "/image/{id}/rotate/{degrees}", async (IMediaFileService service,
            int id,
            int degrees,
            ThumbnailService thumbnailService,
            ILogger<MediaFileModule> logger) =>
            {
                logger.LogDebug($"rotate {id} by {degrees}");
                dynamic response = Results.NotFound();
                var file = await service.Rotate(id, degrees);
                if (file != null)
                {
                    await thumbnailService.GetThumbnailFileInfo(id);
                    response = new
                    {
                        success = true,
                        message = "rotated",
                        data = new
                        {
                            id = file.Id,
                            fileSetPrimaryId = file.FileSetPrimaryId,
                            createdOn = file.CreatedOn,
                            modifiedOn = file.ModifiedOn,
                            name = file.Name,
                            filename = file.Filename,
                            fileCreatedOn = file.FileCreated,
                            fileModifiedOn = file.FileModified,
                            directory = file.Directory == null ? null : file.Directory.Value,
                            fileSize = file.FileSize,
                            width = file.Width,
                            height = file.Height,
                            hidden = file.Hidden,
                            rotationDegrees = file.RotationDegrees
                        }
                    };




                }

                return response;


            });

        }

    }
}
