using MediaTagger.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.FileSystem
{
    public static  class FileSystemEndpoints
    {
    private const string V1_URL_PREFIX = "/api/v1";

    public static void MapEndpoints(this IEndpointRouteBuilder routes)
    {
      
      routes.MapGet(V1_URL_PREFIX + "/filesystem/folders", (IFileSystemService service) =>
            {
              return service.TopFolders();
            });

      routes.MapGet(V1_URL_PREFIX + "/filesystem/folders/children",  (ILogger<FileSystemService> log, IFileSystemService service, [FromQuery]String parent) =>
            {
              try {
              var decode = Uri.UnescapeDataString(parent);
              return Results.Json(service.ChildFolders(decode));
              } catch(Exception ex) {
                log.LogError(ex, "failed to get folders");
                return Results.StatusCode(StatusCodes.Status401Unauthorized);
              }
            });

    }
  }
}
