using MediaTagger.Data;
using MediaTagger.Modules.Tag;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Settings
{
    public static  class SettingsEndpoints
    {
    private const string V1_URL_PREFIX = "/api/v1";

    public static void MapTagEndpoints(this IEndpointRouteBuilder routes)
    {

      routes.MapGet(V1_URL_PREFIX + "/settings", async (MediaTaggerContext db) =>
            {
              return await db.Settings.ToListAsync();
            });

      routes.MapPost(V1_URL_PREFIX + "/settings/", async (SettingModel setting, MediaTaggerContext db) =>
      {
        db.Settings.Add(setting);
        await db.SaveChangesAsync();
        return Results.Created($"/Settings/{setting.Scope}", setting);
      });
    }
  }
}
