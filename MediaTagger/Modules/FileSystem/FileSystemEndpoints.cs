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
      
      routes.MapGet(V1_URL_PREFIX + "/filesystem/folders", async (IFileSystemService service) =>
            {
              return service.TopFolders();
            });

      routes.MapGet(V1_URL_PREFIX + "/filesystem/folders/children", async (IFileSystemService service, [FromQuery]String parent) =>
            {
              var decode = Uri.UnescapeDataString(parent);
              return service.ChildFolders(decode);
            });

    }
  }
}
