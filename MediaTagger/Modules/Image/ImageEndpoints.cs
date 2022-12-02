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


            routes.MapGet("/thumbnail/{id}", async (IHttpContextAccessor contextAccessor, 
            IMediaFileService service, 
            ILogger<ImageService> logger,int id) =>
            {
                var context = contextAccessor.HttpContext;
                context.Response.Headers.CacheControl = $"max-age: {60 * 60 * 24 * 365}";
                context.Response.Headers.Expires = $"{DateTime.Now.AddYears(1).ToString()}";
                context.Response.Headers.CacheControl = $"max-age: {60 * 60 * 24 * 365}";
                context.Response.Headers.LastModified = $"{DateTime.Now.ToString()}";
                var file = await service.GetMediaFileById(id);
                if (file == null)
                {
                    return Results.NotFound();
                }
                if (!service.IsWebImageType(file)) {
                  return Results.LocalRedirect("~/image/unknownType.png");
                }
                var path = service.GetFilePath(file);

                try
                {
                    var responseStream = new MemoryStream();
                    using (var img = new MagickImage(path))
                    {
                        img.Resize(256,256);
                        img.Write(responseStream, MagickFormat.Jpeg);
                        var bytes = img.ToByteArray();
                        return Results.Bytes(bytes, "image/jpeg");
                        //var thumb = Results.File(path, service.GetFileMimeType(file));
                        //return thumb;
                    }
                }
                catch (Exception ex)
                {
                  logger.LogError(ex,"unable to convert image");
                  return Results.NoContent();
                }
            });
    
        }


    }
}
