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
        if (file == null) {
          return Results.NotFound();
        }
        var path = service.GetFilePath(file);
        return Results.File(path, service.GetFileMimeType(file));

      });


    }
  }
}